import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeliveryEventType,
  PaymentMethod,
  PaymentStatus,
  RefundStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentIntentDto, ProcessRefundDto, VerifyPaymentDto } from './dto/payment.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async createIntent(customerId: string, dto: CreatePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new UnauthorizedException('Access denied to this order');
    }

    // Check if idempotency key was already used
    if (dto.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    const idempotencyKey =
      dto.idempotencyKey || `pay-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    return this.prisma.payment.create({
      data: {
        orderId: order.id,
        amountPaise: order.fareTotalPaise,
        currency: order.currency,
        method: dto.method,
        status: dto.method === PaymentMethod.CASH ? PaymentStatus.PENDING : PaymentStatus.PENDING,
        provider: 'NEXTUS_PAY',
        idempotencyKey,
      },
    });
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return payment; // Idempotent return
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const pay = await tx.payment.update({
        where: { id: dto.paymentId },
        data: {
          status: PaymentStatus.SUCCESS,
          providerTxnId: dto.providerTxnId,
          signature: dto.signature,
          paidAt: new Date(),
        },
      });

      await tx.deliveryEvent.create({
        data: {
          orderId: payment.orderId,
          eventType: DeliveryEventType.PAYMENT_RECEIVED,
          title: 'Payment Successful',
          description: `Received ₹${payment.amountPaise / 100} via ${payment.method}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: payment.order.customerId,
          title: 'Payment Successful',
          message: `Your payment of ₹${payment.amountPaise / 100} was successful.`,
          type: 'PAYMENT',
          metadata: { orderId: payment.orderId, paymentId: payment.id },
        },
      });

      return pay;
    });

    await this.auditService.log({
      actorId: userId,
      action: 'PAYMENT_VERIFIED',
      entity: 'Payment',
      entityId: payment.id,
      details: { amount: payment.amountPaise / 100, txnId: dto.providerTxnId },
    });

    return updated;
  }

  async handleWebhook(signature: string, payload: any, rawBody?: string) {
    const secret = this.configService.get<string>(
      'PAYMENT_WEBHOOK_SECRET',
      'whsec_dev_nextus_payment_secret_mock_signature_2026',
    );

    // Verify HMAC SHA-256 signature
    const stringToVerify = rawBody || JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(stringToVerify)
      .digest('hex');

    if (signature && signature !== expectedSignature) {
      // In development mode, warn if signatures don't match, or reject
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const { event, paymentId, providerTxnId, status } = payload;
    if (!paymentId) {
      throw new BadRequestException('paymentId is required in webhook payload');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status === PaymentStatus.SUCCESS && status === 'SUCCESS') {
      return { received: true, message: 'Already processed' };
    }

    const newStatus = status === 'SUCCESS' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        providerTxnId: providerTxnId || payment.providerTxnId,
        paidAt: newStatus === PaymentStatus.SUCCESS ? new Date() : undefined,
      },
    });

    return { received: true };
  }

  async refund(actorId: string, dto: ProcessRefundDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    if (dto.amountPaise > payment.amountPaise) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const refund = await this.prisma.$transaction(async (tx) => {
      const ref = await tx.refund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          amountPaise: dto.amountPaise,
          reason: dto.reason,
          status: RefundStatus.PROCESSED,
          referenceNumber: `REF-${Date.now()}`,
          processedAt: new Date(),
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED },
      });

      await tx.notification.create({
        data: {
          userId: payment.order.customerId,
          title: 'Refund Processed',
          message: `Refund of ₹${dto.amountPaise / 100} has been processed for order ${payment.order.trackingNumber}.`,
          type: 'PAYMENT',
          metadata: { orderId: payment.orderId, refundId: ref.id },
        },
      });

      return ref;
    });

    await this.auditService.log({
      actorId,
      action: 'PAYMENT_REFUNDED',
      entity: 'Refund',
      entityId: refund.id,
      details: { amount: dto.amountPaise / 100, reason: dto.reason },
    });

    return refund;
  }
}
