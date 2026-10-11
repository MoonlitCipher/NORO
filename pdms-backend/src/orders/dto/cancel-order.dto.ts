import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Changed my plans / no longer needed' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
