import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliverySpeed, PackageType, VehicleType } from '@prisma/client';

export class QuoteDto {
  @ApiProperty({ example: 'Parvathipuram, Nagercoil' })
  @IsNotEmpty()
  @IsString()
  pickupAddress: string;

  @ApiProperty({ example: 'Tower Junction, Nagercoil' })
  @IsNotEmpty()
  @IsString()
  dropAddress: string;

  @ApiProperty({ example: 8.1883, required: false })
  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @ApiProperty({ example: 77.4119, required: false })
  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @ApiProperty({ example: 8.1804, required: false })
  @IsOptional()
  @IsNumber()
  dropLat?: number;

  @ApiProperty({ example: 77.4334, required: false })
  @IsOptional()
  @IsNumber()
  dropLng?: number;

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

  @ApiProperty({ enum: VehicleType, example: VehicleType.BIKE, required: false })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiProperty({ example: 3.5, required: false })
  @IsOptional()
  @IsNumber()
  distanceKm?: number;
}
