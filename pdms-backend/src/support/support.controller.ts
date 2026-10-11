import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto, ReplyTicketDto } from './dto/support.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Submit a new support ticket' })
  async createTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportService.createTicket(userId, dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets (filtered by role)' })
  async getTickets(@CurrentUser() user: { id: string; role: Role }) {
    return this.supportService.getTickets(user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Patch('tickets/:id/reply')
  @ApiOperation({ summary: 'Reply to support ticket (Admin/Operations)' })
  async replyTicket(
    @Param('id') ticketId: string,
    @Body() dto: ReplyTicketDto,
  ) {
    return this.supportService.replyTicket(ticketId, dto);
  }
}
