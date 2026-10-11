import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  DeliveryEventType,
  KycStatus,
  OrderStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignOrderDto } from './dto/assign-order.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DispatchService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async acceptJob(orderId: string, userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!partner) {
      throw new ForbiddenException('You are not registered as a delivery partner');
    }

    if (partner.kycStatus !== KycStatus.APPROVED) {
      throw new ForbiddenException('Your partner KYC is pending verification or suspended');
    }

    // Atomic claim with concurrency protection
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Try atomic update
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.PLACED,
          partnerId: null,
        },
        data: {
          partnerId: partner.id,
          status: OrderStatus.ASSIGNED,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'This delivery job has already been claimed by another partner or is no longer available.',
        );
      }

      // 2. Fetch updated order
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      // 3. Record acceptance in DeliveryAssignment
      await tx.deliveryAssignment.create({
        data: {
          orderId,
          partnerId: partner.id,
          status: AssignmentStatus.ACCEPTED,
          respondedAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      // 4. Record event
      await tx.deliveryEvent.create({
        data: {
          orderId,
          partnerId: partner.id,
          eventType: DeliveryEventType.PARTNER_ASSIGNED,
          title: 'Partner Assigned',
          description: `${partner.user.name} accepted the delivery job`,
        },
      });

      // 5. Notify customer
      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'Delivery Partner Assigned',
          message: `${partner.user.name} is on the way to pick up your parcel.`,
          type: 'ORDER_STATUS',
          metadata: { orderId, partnerName: partner.user.name },
        },
      });

      return order;
    });

    await this.auditService.log({
      actorId: userId,
      action: 'JOB_ACCEPTED',
      entity: 'Order',
      entityId: orderId,
      details: { partnerId: partner.id },
    });

    return result;
  }

  async rejectJob(orderId: string, userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('Delivery partner not found');
    }

    await this.prisma.deliveryAssignment.create({
      data: {
        orderId,
        partnerId: partner.id,
        status: AssignmentStatus.REJECTED,
        respondedAt: new Date(),
        expiresAt: new Date(),
      },
    });

    return { message: 'Job offer declined' };
  }

  async manualAssign(dto: AssignOrderDto, actorId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { id: dto.partnerId },
      include: { user: true },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    if (partner.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException('Cannot assign order to unapproved or suspended partner');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestException(
        `Cannot assign partner to order with status ${order.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: dto.orderId },
        data: {
          partnerId: partner.id,
          status: OrderStatus.ASSIGNED,
        },
      });

      await tx.deliveryAssignment.create({
        data: {
          orderId: dto.orderId,
          partnerId: partner.id,
          status: AssignmentStatus.ACCEPTED,
          respondedAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      await tx.deliveryEvent.create({
        data: {
          orderId: dto.orderId,
          partnerId: partner.id,
          eventType: DeliveryEventType.PARTNER_ASSIGNED,
          title: 'Partner Assigned Manually',
          description: `${partner.user.name} assigned by operations team`,
        },
      });

      await tx.notification.create({
        data: {
          userId: order.customerId,
          title: 'Delivery Partner Assigned',
          message: `${partner.user.name} has been assigned to your order.`,
          type: 'ORDER_STATUS',
          metadata: { orderId: dto.orderId },
        },
      });

      return ord;
    });

    await this.auditService.log({
      actorId,
      action: 'MANUAL_DISPATCH_ASSIGNMENT',
      entity: 'Order',
      entityId: dto.orderId,
      details: { partnerId: dto.partnerId },
    });

    return updated;
  }
}
