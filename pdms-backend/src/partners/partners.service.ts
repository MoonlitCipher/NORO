import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DocumentStatus,
  KycStatus,
  OrderStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import {
  CompleteDeliveryDto,
  CreateVehicleDto,
  SubmitDocumentDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
} from './dto/partner.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PartnersService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private auditService: AuditService,
  ) {}

  async getProfile(userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        vehicles: true,
        documents: true,
      },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner profile not found');
    }

    return partner;
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    if (dto.isAvailable && partner.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot go online while KYC is pending verification or rejected',
      );
    }

    return this.prisma.partnerProfile.update({
      where: { userId },
      data: { isAvailable: dto.isAvailable },
    });
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    return this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        currentLat: dto.latitude,
        currentLng: dto.longitude,
      },
    });
  }

  async submitDocument(userId: string, dto: SubmitDocumentDto) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    return this.prisma.partnerDocument.create({
      data: {
        partnerId: partner.id,
        docType: dto.docType,
        documentNumber: dto.documentNumber,
        fileUrl: dto.fileUrl,
        verificationStatus: DocumentStatus.PENDING,
      },
    });
  }

  async addVehicle(userId: string, dto: CreateVehicleDto) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    const exists = await this.prisma.vehicle.findUnique({
      where: { plateNumber: dto.plateNumber },
    });

    if (exists) {
      throw new ConflictException('A vehicle with this license plate already exists');
    }

    return this.prisma.vehicle.create({
      data: {
        partnerId: partner.id,
        vehicleType: dto.vehicleType,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        plateNumber: dto.plateNumber,
        isVerified: false,
      },
    });
  }

  async getAvailableOrders(userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.PLACED,
        partnerId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        customer: { select: { name: true, phone: true } },
      },
    });
  }

  async getActiveOrder(userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    const activeStatuses: OrderStatus[] = [
      OrderStatus.ASSIGNED,
      OrderStatus.PICKUP_IN_PROGRESS,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.OUT_FOR_DELIVERY,
    ];

    return this.prisma.order.findFirst({
      where: {
        partnerId: partner.id,
        status: { in: activeStatuses },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        events: { orderBy: { createdAt: 'asc' } },
        payments: true,
      },
    });
  }

  async pickupOrder(orderId: string, userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('Delivery partner not found');
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.partnerId !== partner.id) {
      throw new ForbiddenException('Order is not assigned to you');
    }

    // Advance to PICKED_UP
    return this.ordersService.transitionStatus(orderId, OrderStatus.PICKED_UP, userId, {
      partnerId: partner.id,
      notes: 'Parcel collected from sender',
    });
  }

  async inTransitOrder(orderId: string, userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.partnerId !== partner.id) {
      throw new ForbiddenException('Order is not assigned to you');
    }

    return this.ordersService.transitionStatus(orderId, OrderStatus.IN_TRANSIT, userId, {
      partnerId: partner.id,
      notes: 'Parcel is on the way to destination',
    });
  }

  async completeDelivery(orderId: string, userId: string, dto: CompleteDeliveryDto) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('Delivery partner not found');
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.partnerId !== partner.id) {
      throw new ForbiddenException('Order is not assigned to you');
    }

    return this.ordersService.transitionStatus(orderId, OrderStatus.DELIVERED, userId, {
      partnerId: partner.id,
      proofUrl: dto.proofUrl,
      notes: dto.notes || 'Package handed over to recipient',
    });
  }

  async getDeliveryHistory(userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found');
    }

    return this.prisma.order.findMany({
      where: {
        partnerId: partner.id,
        status: { in: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        earnings: true,
      },
    });
  }
}
