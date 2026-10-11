import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EarningStatus, SettlementStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EarningsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getPartnerEarnings(userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('Partner profile not found');
    }

    const earnings = await this.prisma.partnerEarning.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { trackingNumber: true, createdAt: true } },
      },
    });

    const totalEarnedPaise = earnings.reduce(
      (sum, e) => sum + e.netAmountPaise,
      0,
    );
    const pendingSettlementPaise = earnings
      .filter((e) => e.status === EarningStatus.CREDITED)
      .reduce((sum, e) => sum + e.netAmountPaise, 0);

    const settlements = await this.prisma.settlement.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      partnerId: partner.id,
      totalEarnedPaise,
      totalEarnedRupees: totalEarnedPaise / 100,
      pendingSettlementPaise,
      pendingSettlementRupees: pendingSettlementPaise / 100,
      bankAccount: partner.bankAccountNumber,
      ifsc: partner.bankIfsc,
      earnings,
      settlements,
    };
  }

  async requestSettlement(userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new ForbiddenException('Partner profile not found');
    }

    const creditedEarnings = await this.prisma.partnerEarning.findMany({
      where: {
        partnerId: partner.id,
        status: EarningStatus.CREDITED,
      },
    });

    const totalAmountPaise = creditedEarnings.reduce(
      (sum, e) => sum + e.netAmountPaise,
      0,
    );

    if (totalAmountPaise <= 0) {
      throw new BadRequestException('No pending credited earnings available for payout');
    }

    const settlement = await this.prisma.$transaction(async (tx) => {
      const sett = await tx.settlement.create({
        data: {
          partnerId: partner.id,
          amountPaise: totalAmountPaise,
          status: SettlementStatus.PENDING,
          referenceNumber: `SETTLE-${Date.now()}`,
        },
      });

      await tx.partnerEarning.updateMany({
        where: {
          id: { in: creditedEarnings.map((e) => e.id) },
        },
        data: {
          status: EarningStatus.SETTLED,
        },
      });

      return sett;
    });

    await this.auditService.log({
      actorId: userId,
      action: 'SETTLEMENT_REQUESTED',
      entity: 'Settlement',
      entityId: settlement.id,
      details: { amount: totalAmountPaise / 100 },
    });

    return settlement;
  }

  async getAllSettlements() {
    return this.prisma.settlement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        partner: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });
  }

  async processSettlement(settlementId: string, actorId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException('Settlement record not found');
    }

    const updated = await this.prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: SettlementStatus.COMPLETED,
        processedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'SETTLEMENT_COMPLETED',
      entity: 'Settlement',
      entityId: settlementId,
      details: { amount: settlement.amountPaise / 100 },
    });

    return updated;
  }
}
