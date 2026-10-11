import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePricingRuleDto {
  @ApiProperty({ example: 'Bike Standard', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 4000, description: 'Base fare in integer paise', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseFarePaise?: number;

  @ApiProperty({ example: 2.0, description: 'Base distance included in base fare', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseDistanceKm?: number;

  @ApiProperty({ example: 1200, description: 'Per km charge in paise', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perKmPaise?: number;

  @ApiProperty({ example: 800, description: 'Per kg charge in paise', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perKgPaise?: number;

  @ApiProperty({ example: 4000, description: 'Minimum total fare in paise', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minFarePaise?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
