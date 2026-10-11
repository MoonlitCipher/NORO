import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliverySpeed, PackageType, PaymentMethod } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: 'Parvathipuram, Nagercoil' })
  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @ApiProperty({ example: 'Nagercoil', required: false })
  @IsOptional()
  @IsString()
  pickupCity?: string;

  @ApiProperty({ example: 8.1883, required: false })
  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @ApiProperty({ example: 77.4119, required: false })
  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @ApiProperty({ example: 'Devi Kumar', required: false })
  @IsOptional()
  @IsString()
  pickupContactName?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  pickupContactPhone?: string;

  @ApiProperty({ example: 'Tower Junction, Nagercoil' })
  @IsNotEmpty()
  @IsString()
  dropAddress: string;

  @ApiProperty({ example: 'Nagercoil', required: false })
  @IsOptional()
  @IsString()
  dropCity?: string;

  @ApiProperty({ example: 8.1804, required: false })
  @IsOptional()
  @IsNumber()
  dropLat?: number;

  @ApiProperty({ example: 77.4334, required: false })
  @IsOptional()
  @IsNumber()
  dropLng?: number;

  @ApiProperty({ example: 'Suresh Raina', required: false })
  @IsOptional()
  @IsString()
  dropContactName?: string;

  @ApiProperty({ example: '9840123456', required: false })
  @IsOptional()
  @IsString()
  dropContactPhone?: string;

  @ApiProperty({ enum: DeliverySpeed, example: DeliverySpeed.EXPRESS })
  @IsEnum(DeliverySpeed)
  deliverySpeed: DeliverySpeed;

  @ApiProperty({ enum: PackageType, example: PackageType.SMALL_PARCEL })
  @IsEnum(PackageType)
  packageType: PackageType;

  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @Min(0.1)
  packageWeightKg: number;

  @ApiProperty({ example: 'Books and stationery', required: false })
  @IsOptional()
  @IsString()
  packageDescription?: string;

  @ApiProperty({ example: 'Handle with care', required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.UPI, required: false })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ example: 'idemp-uuid-12345', required: false })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
