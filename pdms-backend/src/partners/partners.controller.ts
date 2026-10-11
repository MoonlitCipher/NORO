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
import { PartnersService } from './partners.service';
import {
  CompleteDeliveryDto,
  CreateVehicleDto,
  SubmitDocumentDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
} from './dto/partner.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Delivery Partners')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.PARTNER)
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get partner profile, verification status, and vehicles' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.partnersService.getProfile(userId);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle delivery partner online/offline availability' })
  async updateAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.partnersService.updateAvailability(userId, dto);
  }

  @Patch('location')
  @ApiOperation({ summary: 'Update partner GPS location coordinates' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.partnersService.updateLocation(userId, dto);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Submit KYC document (ID proof, License, RC)' })
  async submitDocument(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitDocumentDto,
  ) {
    return this.partnersService.submitDocument(userId, dto);
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Register a delivery vehicle' })
  async addVehicle(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.partnersService.addVehicle(userId, dto);
  }

  @Get('orders/available')
  @ApiOperation({ summary: 'Browse available delivery jobs' })
  async getAvailableOrders(@CurrentUser('id') userId: string) {
    return this.partnersService.getAvailableOrders(userId);
  }

  @Get('orders/active')
  @ApiOperation({ summary: 'Get current active assigned delivery' })
  async getActiveOrder(@CurrentUser('id') userId: string) {
    return this.partnersService.getActiveOrder(userId);
  }

  @Post('orders/:id/pickup')
  @ApiOperation({ summary: 'Confirm parcel pickup from customer' })
  async pickupOrder(
    @Param('id') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.partnersService.pickupOrder(orderId, userId);
  }

  @Post('orders/:id/in-transit')
  @ApiOperation({ summary: 'Mark parcel as in transit' })
  async inTransitOrder(
    @Param('id') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.partnersService.inTransitOrder(orderId, userId);
  }

  @Post('orders/:id/deliver')
  @ApiOperation({ summary: 'Confirm delivery and submit Proof of Delivery' })
  async completeDelivery(
    @Param('id') orderId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CompleteDeliveryDto,
  ) {
    return this.partnersService.completeDelivery(orderId, userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get partner delivery history' })
  async getDeliveryHistory(@CurrentUser('id') userId: string) {
    return this.partnersService.getDeliveryHistory(userId);
  }
}
