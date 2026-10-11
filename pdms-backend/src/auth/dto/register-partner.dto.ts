import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class RegisterPartnerDto {
  @ApiProperty({ example: 'Karthik Raja' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9876599999' })
  @IsNotEmpty()
  @IsString()
  @Length(10, 15)
  phone: string;

  @ApiProperty({ example: 'karthik@partner.nextus.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Partner@123456' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.BIKE })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 'TN-74-XY-9999' })
  @IsNotEmpty()
  @IsString()
  plateNumber: string;

  @ApiProperty({ example: 'Honda Activa', required: false })
  @IsOptional()
  @IsString()
  makeModel?: string;
}
