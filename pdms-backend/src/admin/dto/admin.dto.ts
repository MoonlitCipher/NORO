import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus, KycStatus } from '@prisma/client';

export class UpdateKycDto {
  @ApiProperty({ enum: KycStatus, example: KycStatus.APPROVED })
  @IsEnum(KycStatus)
  status: KycStatus;

  @ApiProperty({ example: 'Documents unclear, please re-upload DL', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifyDocDto {
  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.VERIFIED })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiProperty({ example: 'Expired document', required: false })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
