import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  ProcessRefundDto,
  VerifyPaymentDto,
} from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Payments & Refunds')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post('intent')
  @ApiOperation({ summary: 'Create payment intent for an order' })
  async createIntent(
    @CurrentUser('id') customerId: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createIntent(customerId, dto);
  }

  @ApiBearerAuth()
  @Post('verify')
  @ApiOperation({ summary: 'Verify payment completion (client or provider callback)' })
  async verifyPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(userId, dto);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payment gateway webhook with HMAC-SHA256 signature verification' })
  async webhook(
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.paymentsService.handleWebhook(signature, payload);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Post('refund')
  @ApiOperation({ summary: 'Process payment refund (Admin/Operations)' })
  async processRefund(
    @CurrentUser('id') actorId: string,
    @Body() dto: ProcessRefundDto,
  ) {
    return this.paymentsService.refund(actorId, dto);
  }
}
