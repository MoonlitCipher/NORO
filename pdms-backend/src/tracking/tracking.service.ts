import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async recordLocation(params: {
    orderId: string;
    partnerUserId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId: params.partnerUserId },
    });

    if (!partner) {
      throw new ForbiddenException('Delivery partner not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.partnerId !== partner.id) {
      throw new ForbiddenException('You are not assigned to this order');
    }

    // Save tracking point
    const point = await this.prisma.trackingPoint.create({
      data: {
        orderId: params.orderId,
        partnerId: partner.id,
        latitude: params.latitude,
        longitude: params.longitude,
        speed: params.speed,
        heading: params.heading,
      },
    });

    // Also update partner's latest location
    await this.prisma.partnerProfile.update({
      where: { id: partner.id },
      data: {
        currentLat: params.latitude,
        currentLng: params.longitude,
      },
    });

    return point;
  }

  async getTrackingHistory(orderId: string, user: { id: string; role: Role }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        partner: {
          include: {
            user: { select: { name: true, phone: true } },
            vehicles: true,
          },
        },
        events: { orderBy: { createdAt: 'asc' } },
        trackingPoints: {
          orderBy: { recordedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === Role.CUSTOMER && order.customerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return {
      orderId: order.id,
      trackingNumber: order.trackingNumber,
      status: order.status,
      deliverySpeed: order.deliverySpeed,
      pickup: {
        address: order.pickupAddress,
        lat: order.pickupLat,
        lng: order.pickupLng,
      },
      destination: {
        address: order.dropAddress,
        lat: order.dropLat,
        lng: order.dropLng,
      },
      partner: order.partner
        ? {
            name: order.partner.user.name,
            phone: order.partner.user.phone,
            rating: order.partner.rating,
            totalDeliveries: order.partner.totalDeliveries,
            vehicle: order.partner.vehicles[0],
            latestLocation:
              order.trackingPoints.length > 0
                ? {
                    lat: order.trackingPoints[0].latitude,
                    lng: order.trackingPoints[0].longitude,
                  }
                : null,
          }
        : null,
      events: order.events,
      trackingPoints: order.trackingPoints.reverse(),
    };
  }
}
