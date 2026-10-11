import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignOrderDto {
  @ApiProperty({ example: 'uuid-order-id' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'uuid-partner-profile-id' })
  @IsNotEmpty()
  @IsString()
  partnerId: string;
}
