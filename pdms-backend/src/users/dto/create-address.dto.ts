import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: '42 South Car Street' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ example: 'Parvathipuram' })
  @IsNotEmpty()
  @IsString()
  area: string;

  @ApiProperty({ example: 'Nagercoil' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ example: 'Tamil Nadu', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '629003' })
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 8.1883, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 77.4119, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
