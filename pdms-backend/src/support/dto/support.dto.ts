import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ example: 'Delivery delayed' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'My order has not moved for 30 minutes.' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ example: 'uuid-order-id', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.MEDIUM, required: false })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class ReplyTicketDto {
  @ApiProperty({ example: 'We have dispatched an update to the partner.' })
  @IsNotEmpty()
  @IsString()
  response: string;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.RESOLVED, required: false })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
