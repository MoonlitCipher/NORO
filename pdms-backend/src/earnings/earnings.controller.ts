import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Partner Earnings & Settlements')
@ApiBearerAuth()
@Controller('earnings')
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER)
  @Get('my')
  @ApiOperation({ summary: 'Get current partner earnings summary and payout records' })
  async getMyEarnings(@CurrentUser('id') userId: string) {
    return this.earningsService.getPartnerEarnings(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.PARTNER)
  @Post('settlement-request')
  @ApiOperation({ summary: 'Request settlement / bank payout of credited earnings' })
  async requestSettlement(@CurrentUser('id') userId: string) {
    return this.earningsService.requestSettlement(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Get('settlements')
  @ApiOperation({ summary: 'List all partner settlements (Admin/Operations)' })
  async getSettlements() {
    return this.earningsService.getAllSettlements();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Patch('settlements/:id/process')
  @ApiOperation({ summary: 'Approve and process a partner settlement payout' })
  async processSettlement(
    @Param('id') settlementId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.earningsService.processSettlement(settlementId, actorId);
  }
}
