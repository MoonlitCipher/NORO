import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType, VehicleType } from '@prisma/client';

export class UpdateAvailabilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable: boolean;
}

export class UpdateLocationDto {
  @ApiProperty({ example: 8.1834 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 77.4119 })
  @IsNumber()
  longitude: number;
}

export class SubmitDocumentDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.DRIVING_LICENSE })
  @IsEnum(DocumentType)
  docType: DocumentType;

  @ApiProperty({ example: 'DL-TN-2023001234' })
  @IsNotEmpty()
  @IsString()
  documentNumber: string;

  @ApiProperty({ example: '/uploads/docs/license.png' })
  @IsNotEmpty()
  @IsString()
  fileUrl: string;
}

export class CreateVehicleDto {
  @ApiProperty({ enum: VehicleType, example: VehicleType.BIKE })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 'Honda' })
  @IsNotEmpty()
  @IsString()
  make: string;

  @ApiProperty({ example: 'Activa' })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({ example: 2023 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 'TN-74-XY-1234' })
  @IsNotEmpty()
  @IsString()
  plateNumber: string;
}

export class CompleteDeliveryDto {
  @ApiProperty({ example: '/uploads/pod/signature_or_photo.jpg', required: false })
  @IsOptional()
  @IsString()
  proofUrl?: string;

  @ApiProperty({ example: 'Handed over directly to customer at gate', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
