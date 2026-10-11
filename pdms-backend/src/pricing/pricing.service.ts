import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliverySpeed, VehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteDto } from './dto/quote.dto';
import { UpdatePricingRuleDto } from './dto/update-rule.dto';

export interface FareCalculationResult {
  distanceKm: number;
  estimatedDurationMins: number;
  baseFarePaise: number;
  distanceChargePaise: number;
  weightChargePaise: number;
  speedChargePaise: number;
  totalFarePaise: number;
  totalFareRupees: number;
  currency: string;
  ruleName: string;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.max(1.0, Math.round(dist * 10) / 10);
  }

  async calculateQuote(dto: QuoteDto): Promise<FareCalculationResult> {
    const vehicleType = dto.vehicleType || VehicleType.BIKE;
    const deliverySpeed = dto.deliverySpeed || DeliverySpeed.STANDARD;

    let rule = await this.prisma.pricingRule.findUnique({
      where: {
        vehicleType_deliverySpeed: {
          vehicleType,
          deliverySpeed,
        },
      },
    });

    if (!rule || !rule.isActive) {
      // Fallback to active rule for vehicleType
      rule = await this.prisma.pricingRule.findFirst({
        where: { vehicleType, isActive: true },
      });
    }

    if (!rule) {
      // Fallback default
      rule = {
        id: 'default',
        name: 'Default Pricing',
        vehicleType,
        deliverySpeed,
        baseFarePaise: deliverySpeed === DeliverySpeed.EXPRESS ? 8000 : 5000,
        baseDistanceKm: 2.0,
        perKmPaise: deliverySpeed === DeliverySpeed.EXPRESS ? 1800 : 1200,
        perKgPaise: 1000,
        minFarePaise: deliverySpeed === DeliverySpeed.EXPRESS ? 6000 : 4000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    let distanceKm = dto.distanceKm;
    if (!distanceKm) {
      if (
        dto.pickupLat &&
        dto.pickupLng &&
        dto.dropLat &&
        dto.dropLng &&
        (dto.pickupLat !== dto.dropLat || dto.pickupLng !== dto.dropLng)
      ) {
        distanceKm = this.calculateHaversineDistance(
          dto.pickupLat,
          dto.pickupLng,
          dto.dropLat,
          dto.dropLng,
        );
      } else {
        distanceKm = 3.5; // realistic default distance in km
      }
    }

    const baseFarePaise = rule.baseFarePaise;
    const extraDistance = Math.max(0, distanceKm - rule.baseDistanceKm);
    const distanceChargePaise = Math.round(extraDistance * rule.perKmPaise);

    const extraWeight = Math.max(0, (dto.packageWeightKg || 1.0) - 1.0);
    const weightChargePaise = Math.round(extraWeight * rule.perKgPaise);

    const speedChargePaise =
      deliverySpeed === DeliverySpeed.EXPRESS ? 3000 : 0; // ₹30 express speed surcharge

    const rawTotal =
      baseFarePaise + distanceChargePaise + weightChargePaise + speedChargePaise;
    const totalFarePaise = Math.max(rule.minFarePaise, rawTotal);

    // Estimate duration: 5 mins base + 4 mins per km
    const estimatedDurationMins = Math.round(
      5 + distanceKm * (deliverySpeed === DeliverySpeed.EXPRESS ? 3.5 : 5),
    );

    return {
      distanceKm,
      estimatedDurationMins,
      baseFarePaise,
      distanceChargePaise,
      weightChargePaise,
      speedChargePaise,
      totalFarePaise,
      totalFareRupees: totalFarePaise / 100,
      currency: 'INR',
      ruleName: rule.name,
    };
  }

  async getRules() {
    return this.prisma.pricingRule.findMany({
      orderBy: [{ vehicleType: 'asc' }, { deliverySpeed: 'asc' }],
    });
  }

  async updateRule(id: string, dto: UpdatePricingRuleDto) {
    const existing = await this.prisma.pricingRule.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Pricing rule not found');
    }

    return this.prisma.pricingRule.update({
      where: { id },
      data: dto,
    });
  }
}
