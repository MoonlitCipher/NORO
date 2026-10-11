import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { AssignOrderDto } from './dto/assign-order.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Delivery Dispatch')
@ApiBearerAuth()
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('accept/:orderId')
  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Accept an available delivery job (concurrency-safe atomic claim)' })
  async acceptJob(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dispatchService.acceptJob(orderId, userId);
  }

  @Post('reject/:orderId')
  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER)
  @ApiOperation({ summary: 'Decline a delivery job offer' })
  async rejectJob(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dispatchService.rejectJob(orderId, userId);
  }

  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATIONS)
  @ApiOperation({ summary: 'Manually assign delivery partner to order (Admin/Operations)' })
  async manualAssign(
    @Body() dto: AssignOrderDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.dispatchService.manualAssign(dto, actorId);
  }
}
