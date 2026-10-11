import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateKycDto, VerifyDocDto } from './dto/admin.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditService } from '../audit/audit.service';

@ApiTags('Admin Operations')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.OPERATIONS)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin overview metrics, active deliveries, and revenue' })
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('partners')
  @ApiOperation({ summary: 'List all delivery partners and KYC status' })
  async getPartners() {
    return this.adminService.getPartners();
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Get detailed partner profile, documents, and vehicle' })
  async getPartnerDetails(@Param('id') id: string) {
    return this.adminService.getPartnerDetails(id);
  }

  @Patch('partners/:id/kyc')
  @ApiOperation({ summary: 'Approve, reject, or suspend partner KYC verification' })
  async updatePartnerKyc(
    @Param('id') partnerId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateKycDto,
  ) {
    return this.adminService.updatePartnerKyc(partnerId, actorId, dto);
  }

  @Patch('documents/:docId/verify')
  @ApiOperation({ summary: 'Approve or reject a partner verification document' })
  async verifyDocument(
    @Param('docId') docId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: VerifyDocDto,
  ) {
    return this.adminService.verifyDocument(docId, actorId, dto);
  }

  @Get('live-tracking')
  @ApiOperation({ summary: 'Get list of all ongoing deliveries with real-time locations' })
  async getLiveTracking() {
    return this.adminService.getLiveTrackingList();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit log event trail' })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
