import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new parcel delivery order' })
  async createOrder(
    @CurrentUser('id') customerId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(customerId, dto);
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'List orders (filtered by user role and query parameters)' })
  async getOrders(
    @CurrentUser() user: { id: string; role: Role },
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.getOrders(user, query);
  }

  @Public()
  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Get order tracking timeline by tracking number' })
  async trackOrder(@Param('trackingNumber') trackingNumber: string) {
    return this.ordersService.getOrderByTrackingNumber(trackingNumber);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  async getOrderById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.ordersService.getOrderById(id, user);
  }

  @ApiBearerAuth()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order (only if not yet collected)' })
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser('id') customerId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, customerId, dto, role);
  }
}
