import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryEventType,
  DeliverySpeed,
  EarningStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private auditService: AuditService,
  ) {}

  private async generateTrackingNumber(): Promise<string> {
    const count = await this.prisma.order.count();
    const sequence = 10247 + count;
    let trackingNumber = `PDMS-${sequence}`;

    const exists = await this.prisma.order.findUnique({
      where: { trackingNumber },
    });
    if (exists) {
      trackingNumber = `PDMS-${sequence + Math.floor(Math.random() * 900) + 100}`;
    }

    return trackingNumber;
  }

  async createOrder(customerId: string, dto: CreateOrderDto) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Server-side verified fare calculation
    const quote = await this.pricingService.calculateQuote({
      pickupAddress: dto.pickupAddress,
      dropAddress: dto.dropAddress,
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      dropLat: dto.dropLat,
      dropLng: dto.dropLng,
      deliverySpeed: dto.deliverySpeed,
      packageType: dto.packageType,
      packageWeightKg: dto.packageWeightKg,
      distanceKm: undefined,
    });

    const trackingNumber = await this.generateTrackingNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          trackingNumber,
          customerId,
          status: OrderStatus.PLACED,
          deliverySpeed: dto.deliverySpeed,
          pickupAddress: dto.pickupAddress,
          pickupCity: dto.pickupCity || 'Nagercoil',
          pickupLat: dto.pickupLat ?? 8.1883,
          pickupLng: dto.pickupLng ?? 77.4119,
          pickupContactName: dto.pickupContactName || customer.name,
          pickupContactPhone: dto.pickupContactPhone || customer.phone,
          dropAddress: dto.dropAddress,
          dropCity: dto.dropCity || 'Nagercoil',
          dropLat: dto.dropLat ?? 8.1804,
          dropLng: dto.dropLng ?? 77.4334,
          dropContactName: dto.dropContactName || 'Recipient',
          dropContactPhone: dto.dropContactPhone || '9876500000',
          packageType: dto.packageType,
          packageWeightKg: dto.packageWeightKg,
          packageDescription: dto.packageDescription,
          specialInstructions: dto.specialInstructions,
          distanceKm: quote.distanceKm,
          estimatedDurationMins: quote.estimatedDurationMins,
          fareBasePaise: quote.baseFarePaise,
          fareDistancePaise: quote.distanceChargePaise,
          fareWeightPaise: quote.weightChargePaise,
          fareSpeedPaise: quote.speedChargePaise,
          fareTotalPaise: quote.totalFarePaise,
          currency: 'INR',
          events: {
            create: {
              eventType: DeliveryEventType.BOOKING_CREATED,
              title: 'Booking Confirmed',
              description: `Booking confirmed with tracking ID ${trackingNumber}`,
              latitude: dto.pickupLat ?? 8.1883,
              longitude: dto.pickupLng ?? 77.4119,
            },
          },
          ...(dto.paymentMethod
            ? {
                payments: {
                  create: {
                    amountPaise: quote.totalFarePaise,
                    currency: 'INR',
                    method: dto.paymentMethod,
                    status:
                      dto.paymentMethod === PaymentMethod.CASH
                        ? PaymentStatus.PENDING
                        : PaymentStatus.SUCCESS,
                    provider: 'NEXTUS_PAY',
                    idempotencyKey: dto.idempotencyKey || `pay-${Date.now()}-${trackingNumber}`,
                    paidAt:
                      dto.paymentMethod !== PaymentMethod.CASH ? new Date() : undefined,
                  },
                },
              }
            : {}),
        },
        include: {
          events: true,
          payments: true,
        },
      });

      // Send initial notification
      await tx.notification.create({
        data: {
          userId: customerId,
          title: 'Booking Confirmed!',
          message: `Your booking ${trackingNumber} has been received and scheduled for pickup.`,
          type: 'ORDER_STATUS',
          metadata: { orderId: newOrder.id, trackingNumber },
        },
      });

      return newOrder;
    });

    await this.auditService.log({
      actorId: customerId,
      action: 'ORDER_CREATED',
      entity: 'Order',
      entityId: order.id,
      details: { trackingNumber, totalFare: quote.totalFareRupees },
    });

    return order;
  }

  async getOrders(user: { id: string; role: Role }, query: OrderQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === Role.CUSTOMER) {
      where.customerId = user.id;
    } else if (user.role === Role.PARTNER) {
      const partner = await this.prisma.partnerProfile.findUnique({
        where: { userId: user.id },
      });
      if (partner) {
        where.partnerId = partner.id;
      } else {
        return { orders: [], total: 0, page, limit, pages: 0 };
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { trackingNumber: { contains: query.search, mode: 'insensitive' } },
        { pickupAddress: { contains: query.search, mode: 'insensitive' } },
        { dropAddress: { contains: query.search, mode: 'insensitive' } },
        { dropContactName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          partner: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
              vehicles: true,
            },
          },
          payments: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getOrderById(id: string, user: { id: string; role: Role }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        partner: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            vehicles: true,
          },
        },
        events: { orderBy: { createdAt: 'asc' } },
        trackingPoints: { orderBy: { recordedAt: 'asc' }, take: 50 },
        payments: { include: { refunds: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Role-based access check
    if (user.role === Role.CUSTOMER && order.customerId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    if (user.role === Role.PARTNER) {
      const partner = await this.prisma.partnerProfile.findUnique({
        where: { userId: user.id },
      });
      if (!partner || order.partnerId !== partner.id) {
        throw new ForbiddenException('You are not assigned to this order');
      }
    }

    return order;
  }

  async getOrderByTrackingNumber(trackingNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { trackingNumber },
      include: {
        partner: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            vehicles: true,
          },
        },
        events: { orderBy: { createdAt: 'asc' } },
        trackingPoints: { orderBy: { recordedAt: 'desc' }, take: 10 },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with tracking number ${trackingNumber} not found`);
    }

    return order;
  }

  async cancelOrder(id: string, customerId: string, dto: CancelOrderDto, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === Role.CUSTOMER && order.customerId !== customerId) {
      throw new ForbiddenException('You cannot cancel another customer’s order');
    }

    // State machine check
    const nonCancellableStates: OrderStatus[] = [
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];

    if (nonCancellableStates.includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be cancelled in state ${order.status}. Delivery is already underway or completed.`,
      );
    }

    const cancelledOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: dto.reason,
          cancelledAt: new Date(),
          events: {
            create: {
              eventType: DeliveryEventType.CANCELLED,
              title: 'Order Cancelled',
              description: `Cancellation requested: ${dto.reason}`,
            },
          },
        },
      });

      // Auto-refund successful payments
      for (const payment of order.payments) {
        if (payment.status === PaymentStatus.SUCCESS) {
          await tx.refund.create({
            data: {
              paymentId: payment.id,
              orderId: order.id,
              amountPaise: payment.amountPaise,
              reason: `Order cancelled: ${dto.reason}`,
              status: RefundStatus.PROCESSED,
              referenceNumber: `REF-${Date.now()}`,
              processedAt: new Date(),
            },
          });

          await tx.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.REFUNDED },
          });
        }
      }

      // Notify customer
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'Order Cancelled',
          message: `Order ${order.trackingNumber} has been cancelled.`,
          type: 'ORDER_STATUS',
          metadata: { orderId: order.id, reason: dto.reason },
        },
      });

      return updated;
    });

    await this.auditService.log({
      actorId: customerId,
      action: 'ORDER_CANCELLED',
      entity: 'Order',
      entityId: id,
      details: { reason: dto.reason },
    });

    return cancelledOrder;
  }

  async transitionStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorId?: string,
    details?: { proofUrl?: string; notes?: string; partnerId?: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Valid state transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PLACED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      [OrderStatus.ASSIGNED]: [OrderStatus.PICKUP_IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.PICKUP_IN_PROGRESS]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${newStatus}`,
      );
    }

    const eventTypeMap: Record<OrderStatus, DeliveryEventType> = {
      [OrderStatus.ASSIGNED]: DeliveryEventType.PARTNER_ASSIGNED,
      [OrderStatus.PICKUP_IN_PROGRESS]: DeliveryEventType.PICKUP_STARTED,
      [OrderStatus.PICKED_UP]: DeliveryEventType.PARCEL_COLLECTED,
      [OrderStatus.IN_TRANSIT]: DeliveryEventType.IN_TRANSIT,
      [OrderStatus.OUT_FOR_DELIVERY]: DeliveryEventType.OUT_FOR_DELIVERY,
      [OrderStatus.DELIVERED]: DeliveryEventType.DELIVERED,
      [OrderStatus.CANCELLED]: DeliveryEventType.CANCELLED,
      [OrderStatus.PLACED]: DeliveryEventType.BOOKING_CREATED,
    };

    const titleMap: Record<OrderStatus, string> = {
      [OrderStatus.ASSIGNED]: 'Partner Assigned',
      [OrderStatus.PICKUP_IN_PROGRESS]: 'Pickup in Progress',
      [OrderStatus.PICKED_UP]: 'Pickup Completed',
      [OrderStatus.IN_TRANSIT]: 'Parcel In Transit',
      [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [OrderStatus.DELIVERED]: 'Delivered Successfully',
      [OrderStatus.CANCELLED]: 'Order Cancelled',
      [OrderStatus.PLACED]: 'Booking Placed',
    };

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: newStatus,
        events: {
          create: {
            eventType: eventTypeMap[newStatus],
            title: titleMap[newStatus],
            description: details?.notes || `Delivery status changed to ${newStatus}`,
            partnerId: details?.partnerId || order.partnerId,
          },
        },
      };

      if (newStatus === OrderStatus.PICKED_UP) {
        updateData.pickupTime = new Date();
      }

      if (newStatus === OrderStatus.DELIVERED) {
        updateData.deliveredAt = new Date();
        updateData.proofOfDeliveryUrl = details?.proofUrl;
        updateData.proofNotes = details?.notes;

        // Calculate and credit partner earnings
        if (order.partnerId) {
          const grossAmountPaise = order.fareTotalPaise;
          const commissionPaise = Math.round(grossAmountPaise * 0.2); // 20% commission
          const netAmountPaise = grossAmountPaise - commissionPaise;

          await tx.partnerEarning.create({
            data: {
              partnerId: order.partnerId,
              orderId: order.id,
              grossAmountPaise,
              commissionPaise,
              netAmountPaise,
              status: EarningStatus.CREDITED,
            },
          });

          await tx.partnerProfile.update({
            where: { id: order.partnerId },
            data: {
              totalDeliveries: { increment: 1 },
            },
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          events: true,
          partner: true,
        },
      });

      // Customer notification
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: titleMap[newStatus],
          message: `Your package ${order.trackingNumber} status is now: ${newStatus}`,
          type: 'ORDER_STATUS',
          metadata: { orderId: order.id, status: newStatus },
        },
      });

      return updated;
    });
  }
}
