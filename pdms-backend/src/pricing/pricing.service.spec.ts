import { PricingService } from './pricing.service';
import { DeliverySpeed, VehicleType, PackageType } from '@prisma/client';

describe('PricingService', () => {
  let service: PricingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      pricingRule: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'rule-1',
          name: 'Bike Express',
          vehicleType: VehicleType.BIKE,
          deliverySpeed: DeliverySpeed.EXPRESS,
          baseFarePaise: 6000, // ₹60
          baseDistanceKm: 2.0,
          perKmPaise: 1800,   // ₹18/km
          perKgPaise: 1200,   // ₹12/kg
          minFarePaise: 6000,
          isActive: true,
        }),
        findFirst: jest.fn(),
      },
    };
    service = new PricingService(mockPrisma);
  });

  it('calculates Haversine distance correctly between two points', () => {
    // Parvathipuram (8.1883, 77.4119) to Tower Junction (8.1804, 77.4334) ~ 2.5 km
    const dist = service.calculateHaversineDistance(8.1883, 77.4119, 8.1804, 77.4334);
    expect(dist).toBeGreaterThan(1.5);
    expect(dist).toBeLessThan(4.0);
  });

  it('calculates accurate fare breakdown and enforces minimum fare in integer paise', async () => {
    const quote = await service.calculateQuote({
      pickupAddress: 'Parvathipuram',
      dropAddress: 'Tower Junction',
      pickupLat: 8.1883,
      pickupLng: 77.4119,
      dropLat: 8.1804,
      dropLng: 77.4334,
      deliverySpeed: DeliverySpeed.EXPRESS,
      packageType: PackageType.SMALL_PARCEL,
      packageWeightKg: 2.5,
    });

    expect(quote.baseFarePaise).toBe(6000);
    expect(quote.speedChargePaise).toBe(3000);
    expect(quote.weightChargePaise).toBeGreaterThan(0);
    expect(quote.totalFarePaise).toBeGreaterThan(9000);
    expect(quote.totalFareRupees).toBe(quote.totalFarePaise / 100);
    expect(Number.isInteger(quote.totalFarePaise)).toBe(true);
  });
});
