import { Body, Controller, Get, Param, Put, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { QuoteDto } from './dto/quote.dto';
import { UpdatePricingRuleDto } from './dto/update-rule.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Pricing & Quotations')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Public()
  @Post('quote')
  @ApiOperation({ summary: 'Calculate estimated delivery fare and duration' })
  async getQuote(@Body() dto: QuoteDto) {
    return this.pricingService.calculateQuote(dto);
  }

  @Public()
  @Get('rules')
  @ApiOperation({ summary: 'Get all active pricing rules' })
  async getRules() {
    return this.pricingService.getRules();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Put('rules/:id')
  @ApiOperation({ summary: 'Update pricing rule configuration (Admin/Operations only)' })
  async updateRule(
    @Param('id') id: string,
    @Body() dto: UpdatePricingRuleDto,
  ) {
    return this.pricingService.updateRule(id, dto);
  }
}
