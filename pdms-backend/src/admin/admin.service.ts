import {
  BadRequestException,
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
import { UpdateKycDto, VerifyDocDto } from './dto/admin.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getDashboardMetrics() {
    const [
      totalOrders,
      activeOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalPartners,
      onlinePartners,
      pendingKycPartners,
      earningsAggregate,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.PLACED,
              OrderStatus.ASSIGNED,
              OrderStatus.PICKUP_IN_PROGRESS,
              OrderStatus.PICKED_UP,
              OrderStatus.IN_TRANSIT,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.partnerProfile.count(),
      this.prisma.partnerProfile.count({ where: { isAvailable: true } }),
      this.prisma.partnerProfile.count({ where: { kycStatus: KycStatus.PENDING } }),
      this.prisma.partnerEarning.aggregate({
        _sum: {
          grossAmountPaise: true,
          commissionPaise: true,
          netAmountPaise: true,
        },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, phone: true } },
          partner: {
            include: {
              user: { select: { name: true, phone: true } },
            },
          },
        },
      }),
    ]);

    const grossRevenuePaise = earningsAggregate._sum.grossAmountPaise || 0;
    const platformCommissionPaise = earningsAggregate._sum.commissionPaise || 0;

    return {
      metrics: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalPartners,
        onlinePartners,
        pendingKycPartners,
        grossRevenuePaise,
        grossRevenueRupees: grossRevenuePaise / 100,
        platformCommissionPaise,
        platformCommissionRupees: platformCommissionPaise / 100,
      },
      recentOrders,
    };
  }

  async getPartners() {
    return this.prisma.partnerProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, status: true } },
        vehicles: true,
        documents: true,
      },
    });
  }

  async getPartnerDetails(partnerId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { id: partnerId },
      include: {
        user: true,
        vehicles: true,
        documents: true,
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        earnings: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    return partner;
  }

  async updatePartnerKyc(partnerId: string, actorId: string, dto: UpdateKycDto) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { id: partnerId },
      include: { user: true },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { id: partnerId },
      data: {
        kycStatus: dto.status,
      },
      include: { user: true },
    });

    // Notify partner user
    await this.prisma.notification.create({
      data: {
        userId: partner.userId,
        title: `KYC Verification: ${dto.status}`,
        message:
          dto.status === KycStatus.APPROVED
            ? 'Your KYC documents have been approved! You can now go online and receive delivery jobs.'
            : `Your KYC status is now ${dto.status}. Reason: ${dto.reason || 'Please check submitted documents.'}`,
        type: 'SYSTEM',
      },
    });

    await this.auditService.log({
      actorId,
      action: `PARTNER_KYC_${dto.status}`,
      entity: 'PartnerProfile',
      entityId: partnerId,
      details: { status: dto.status, reason: dto.reason },
    });

    return updated;
  }

  async verifyDocument(docId: string, actorId: string, dto: VerifyDocDto) {
    const doc = await this.prisma.partnerDocument.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const updated = await this.prisma.partnerDocument.update({
      where: { id: docId },
      data: {
        verificationStatus: dto.status,
        rejectionReason: dto.rejectionReason,
        verifiedAt: dto.status === DocumentStatus.VERIFIED ? new Date() : undefined,
      },
    });

    await this.auditService.log({
      actorId,
      action: `PARTNER_DOC_${dto.status}`,
      entity: 'PartnerDocument',
      entityId: docId,
      details: { status: dto.status, reason: dto.rejectionReason },
    });

    return updated;
  }

  async getLiveTrackingList() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.ASSIGNED,
            OrderStatus.PICKUP_IN_PROGRESS,
            OrderStatus.PICKED_UP,
            OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        partner: {
          include: {
            user: { select: { name: true, phone: true } },
            vehicles: true,
          },
        },
        trackingPoints: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
