import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterCustomerDto {
  @ApiProperty({ example: 'Devi Kumar' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  @Length(10, 15)
  phone: string;

  @ApiProperty({ example: 'customer@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Customer@123456' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
