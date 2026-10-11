import { OrdersService } from './orders.service';
import { OrderStatus, Role, DeliverySpeed, PackageType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockPrisma: any;
  let mockPricing: any;
  let mockAudit: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'cust-1', name: 'Devi', phone: '9876543210' }),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      notification: { create: jest.fn() },
    };

    mockPricing = {
      calculateQuote: jest.fn().mockResolvedValue({
        distanceKm: 3.5,
        estimatedDurationMins: 18,
        baseFarePaise: 8000,
        distanceChargePaise: 5000,
        weightChargePaise: 0,
        speedChargePaise: 3000,
        totalFarePaise: 16000,
        totalFareRupees: 160,
      }),
    };

    mockAudit = { log: jest.fn() };

    service = new OrdersService(mockPrisma, mockPricing, mockAudit);
  });

  it('rejects cancellation if order is already IN_TRANSIT', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'ord-1',
      customerId: 'cust-1',
      status: OrderStatus.IN_TRANSIT,
      payments: [],
    });

    await expect(
      service.cancelOrder('ord-1', 'cust-1', { reason: 'Changed mind' }, Role.CUSTOMER),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid state machine transition (e.g. PLACED directly to DELIVERED)', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'ord-1',
      status: OrderStatus.PLACED,
      payments: [],
    });

    await expect(
      service.transitionStatus('ord-1', OrderStatus.DELIVERED, 'actor-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
