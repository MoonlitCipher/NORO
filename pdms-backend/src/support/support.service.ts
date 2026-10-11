import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, ReplyTicketDto } from './dto/support.dto';
import { Role, TicketStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        orderId: dto.orderId,
        subject: dto.subject,
        message: dto.message,
        priority: dto.priority || 'MEDIUM',
      },
    });
  }

  async getTickets(user: { id: string; role: Role }) {
    const where: any = {};
    if (user.role === Role.CUSTOMER || user.role === Role.PARTNER) {
      where.userId = user.id;
    }

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true, role: true } },
        order: { select: { trackingNumber: true } },
      },
    });
  }

  async replyTicket(ticketId: string, dto: ReplyTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        response: dto.response,
        respondedAt: new Date(),
        status: dto.status || TicketStatus.RESOLVED,
      },
    });
  }
}
