import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'uuid-order-id' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 'idemp-key-12345', required: false })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'uuid-payment-id' })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiProperty({ example: 'TXN-982341' })
  @IsNotEmpty()
  @IsString()
  providerTxnId: string;

  @ApiProperty({ example: 'mock-sig-abc123xyz' })
  @IsNotEmpty()
  @IsString()
  signature: string;
}

export class ProcessRefundDto {
  @ApiProperty({ example: 'uuid-payment-id' })
  @IsNotEmpty()
  @IsString()
  paymentId: string;

  @ApiProperty({ example: 16000, description: 'Amount in paise' })
  @IsNumber()
  @Min(100)
  amountPaise: number;

  @ApiProperty({ example: 'Customer cancellation' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
