import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Real-Time Tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':orderId/history')
  @ApiOperation({ summary: 'Get tracking history, partner location, and milestones' })
  async getTrackingHistory(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.trackingService.getTrackingHistory(orderId, user);
  }

  @Post(':orderId/location')
  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Record partner GPS location (HTTP endpoint)' })
  async updateLocationHttp(
    @Param('orderId') orderId: string,
    @CurrentUser('id') partnerUserId: string,
    @Body() body: { latitude: number; longitude: number; speed?: number; heading?: number },
  ) {
    return this.trackingService.recordLocation({
      orderId,
      partnerUserId,
      latitude: body.latitude,
      longitude: body.longitude,
      speed: body.speed,
      heading: body.heading,
    });
  }
}
