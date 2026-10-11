import { PrismaClient, Role, UserStatus, KycStatus, DocumentType, DocumentStatus, VehicleType, DeliverySpeed, PackageType, OrderStatus, DeliveryEventType, PaymentMethod, PaymentStatus, EarningStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Nextus PDMS database...');

  const passwordHash = await bcrypt.hash('Nextus@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);

  // 1. Pricing Rules
  const pricingData = [
    {
      vehicleType: VehicleType.BIKE,
      deliverySpeed: DeliverySpeed.STANDARD,
      name: 'Bike Standard',
      baseFarePaise: 4000, // ₹40
      baseDistanceKm: 2.0,
      perKmPaise: 1200,   // ₹12/km
      perKgPaise: 800,    // ₹8/kg
      minFarePaise: 4000,
      isActive: true,
    },
    {
      vehicleType: VehicleType.BIKE,
      deliverySpeed: DeliverySpeed.EXPRESS,
      name: 'Bike Express',
      baseFarePaise: 6000, // ₹60
      baseDistanceKm: 2.0,
      perKmPaise: 1800,   // ₹18/km
      perKgPaise: 1200,   // ₹12/kg
      minFarePaise: 6000,
      isActive: true,
    },
    {
      vehicleType: VehicleType.SCOOTER,
      deliverySpeed: DeliverySpeed.STANDARD,
      name: 'Scooter Standard',
      baseFarePaise: 4500,
      baseDistanceKm: 2.0,
      perKmPaise: 1400,
      perKgPaise: 900,
      minFarePaise: 4500,
      isActive: true,
    },
    {
      vehicleType: VehicleType.SCOOTER,
      deliverySpeed: DeliverySpeed.EXPRESS,
      name: 'Scooter Express',
      baseFarePaise: 6500,
      baseDistanceKm: 2.0,
      perKmPaise: 2000,
      perKgPaise: 1300,
      minFarePaise: 6500,
      isActive: true,
    },
    {
      vehicleType: VehicleType.VAN,
      deliverySpeed: DeliverySpeed.STANDARD,
      name: 'Van Standard',
      baseFarePaise: 15000,
      baseDistanceKm: 5.0,
      perKmPaise: 3000,
      perKgPaise: 1500,
      minFarePaise: 15000,
      isActive: true,
    },
    {
      vehicleType: VehicleType.VAN,
      deliverySpeed: DeliverySpeed.EXPRESS,
      name: 'Van Express',
      baseFarePaise: 22000,
      baseDistanceKm: 5.0,
      perKmPaise: 4000,
      perKgPaise: 2000,
      minFarePaise: 22000,
      isActive: true,
    },
  ];

  for (const rule of pricingData) {
    await prisma.pricingRule.upsert({
      where: {
        vehicleType_deliverySpeed: {
          vehicleType: rule.vehicleType,
          deliverySpeed: rule.deliverySpeed,
        },
      },
      update: rule,
      create: rule,
    });
  }

  // 2. Admin User
  const admin = await prisma.user.upsert({
    where: { phone: '9876500000' },
    update: {},
    create: {
      name: 'Admin Nextus',
      email: 'admin@nextus.com',
      phone: '9876500000',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Operations User
  await prisma.user.upsert({
    where: { phone: '9876500001' },
    update: {},
    create: {
      name: 'Operations Manager',
      email: 'ops@nextus.com',
      phone: '9876500001',
      passwordHash: passwordHash,
      role: Role.OPERATIONS,
      status: UserStatus.ACTIVE,
    },
  });

  // 3. Customer User
  const customer = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      name: 'Devi Kumar',
      email: 'customer@example.com',
      phone: '9876543210',
      passwordHash: passwordHash,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      addresses: {
        create: [
          {
            label: 'Home',
            street: '42 South Car Street',
            area: 'Parvathipuram',
            city: 'Nagercoil',
            state: 'Tamil Nadu',
            postalCode: '629003',
            latitude: 8.1883,
            longitude: 77.4119,
            isDefault: true,
          },
          {
            label: 'Office',
            street: '12 Court Road',
            area: 'Vadasery',
            city: 'Nagercoil',
            state: 'Tamil Nadu',
            postalCode: '629001',
            latitude: 8.1934,
            longitude: 77.4298,
            isDefault: false,
          },
        ],
      },
    },
  });

  // 4. Partner 1 (Approved & Active - Raj Kumar)
  const partnerUser = await prisma.user.upsert({
    where: { phone: '9876500002' },
    update: {},
    create: {
      name: 'Raj Kumar',
      email: 'raj.kumar@partner.nextus.com',
      phone: '9876500002',
      passwordHash: passwordHash,
      role: Role.PARTNER,
      status: UserStatus.ACTIVE,
    },
  });

  const partnerProfile = await prisma.partnerProfile.upsert({
    where: { userId: partnerUser.id },
    update: {},
    create: {
      userId: partnerUser.id,
      kycStatus: KycStatus.APPROVED,
      isAvailable: true,
      currentLat: 8.1834,
      currentLng: 77.4119,
      rating: 4.8,
      totalDeliveries: 326,
      bankAccountNumber: '918273645012',
      bankIfsc: 'HDFC0001234',
      vehicles: {
        create: {
          vehicleType: VehicleType.BIKE,
          make: 'Honda',
          model: 'Activa 6G',
          year: 2023,
          plateNumber: 'TN-74-AB-1234',
          isVerified: true,
        },
      },
      documents: {
        create: [
          {
            docType: DocumentType.DRIVING_LICENSE,
            documentNumber: 'DL-TN-2021008472',
            fileUrl: '/uploads/docs/dl-rajkumar.jpg',
            verificationStatus: DocumentStatus.VERIFIED,
            verifiedAt: new Date(),
          },
          {
            docType: DocumentType.ID_PROOF,
            documentNumber: 'AADHAAR-847291048291',
            fileUrl: '/uploads/docs/id-rajkumar.jpg',
            verificationStatus: DocumentStatus.VERIFIED,
            verifiedAt: new Date(),
          },
        ],
      },
    },
  });

  // Partner 2 (Pending KYC)
  const pendingPartnerUser = await prisma.user.upsert({
    where: { phone: '9876500003' },
    update: {},
    create: {
      name: 'Arun Prakash',
      email: 'arun@partner.nextus.com',
      phone: '9876500003',
      passwordHash: passwordHash,
      role: Role.PARTNER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.partnerProfile.upsert({
    where: { userId: pendingPartnerUser.id },
    update: {},
    create: {
      userId: pendingPartnerUser.id,
      kycStatus: KycStatus.PENDING,
      isAvailable: false,
      currentLat: 8.175,
      currentLng: 77.42,
      rating: 5.0,
      totalDeliveries: 0,
      bankAccountNumber: '123456789012',
      bankIfsc: 'SBIN0001234',
      vehicles: {
        create: {
          vehicleType: VehicleType.BIKE,
          make: 'Hero',
          model: 'Splendor Plus',
          year: 2022,
          plateNumber: 'TN-74-CD-5678',
          isVerified: false,
        },
      },
      documents: {
        create: [
          {
            docType: DocumentType.DRIVING_LICENSE,
            documentNumber: 'DL-TN-2022998811',
            fileUrl: '/uploads/docs/dl-arun.jpg',
            verificationStatus: DocumentStatus.PENDING,
          },
        ],
      },
    },
  });

  // 5. Existing Demo Order (PDMS-10246)
  const activeOrder = await prisma.order.upsert({
    where: { trackingNumber: 'PDMS-10246' },
    update: {},
    create: {
      trackingNumber: 'PDMS-10246',
      customerId: customer.id,
      partnerId: partnerProfile.id,
      status: OrderStatus.IN_TRANSIT,
      deliverySpeed: DeliverySpeed.EXPRESS,
      pickupAddress: 'Parvathipuram, Main Road, Nagercoil',
      pickupCity: 'Nagercoil',
      pickupLat: 8.1883,
      pickupLng: 77.4119,
      pickupContactName: 'Devi Kumar',
      pickupContactPhone: '9876543210',
      dropAddress: 'Tower Junction, Court Road, Nagercoil',
      dropCity: 'Nagercoil',
      dropLat: 8.1804,
      dropLng: 77.4334,
      dropContactName: 'Suresh Raina',
      dropContactPhone: '9840123456',
      packageType: PackageType.SMALL_PARCEL,
      packageWeightKg: 1.0,
      packageDescription: 'Electronics & documents',
      specialInstructions: 'Handle with care. Call before arriving.',
      distanceKm: 3.5,
      estimatedDurationMins: 18,
      fareBasePaise: 8000,
      fareDistancePaise: 5000,
      fareWeightPaise: 0,
      fareSpeedPaise: 3000,
      fareTotalPaise: 16000,
      pickupTime: new Date(Date.now() - 25 * 60 * 1000),
      events: {
        create: [
          {
            eventType: DeliveryEventType.BOOKING_CREATED,
            title: 'Booking Confirmed',
            description: 'Order placed and confirmed',
            latitude: 8.1883,
            longitude: 77.4119,
            createdAt: new Date(Date.now() - 40 * 60 * 1000),
          },
          {
            eventType: DeliveryEventType.PARTNER_ASSIGNED,
            title: 'Partner Assigned',
            description: 'Raj Kumar assigned to delivery',
            latitude: 8.1883,
            longitude: 77.4119,
            createdAt: new Date(Date.now() - 35 * 60 * 1000),
          },
          {
            eventType: DeliveryEventType.PARCEL_COLLECTED,
            title: 'Pickup Completed',
            description: 'Package picked up from Parvathipuram',
            latitude: 8.1883,
            longitude: 77.4119,
            createdAt: new Date(Date.now() - 25 * 60 * 1000),
          },
          {
            eventType: DeliveryEventType.IN_TRANSIT,
            title: 'Parcel In Transit',
            description: 'Currently on the way to destination',
            latitude: 8.1834,
            longitude: 77.4219,
            createdAt: new Date(Date.now() - 10 * 60 * 1000),
          },
        ],
      },
      trackingPoints: {
        create: [
          {
            partnerId: partnerProfile.id,
            latitude: 8.1883,
            longitude: 77.4119,
            speed: 25.5,
            heading: 120,
            recordedAt: new Date(Date.now() - 20 * 60 * 1000),
          },
          {
            partnerId: partnerProfile.id,
            latitude: 8.1852,
            longitude: 77.419,
            speed: 28.0,
            heading: 115,
            recordedAt: new Date(Date.now() - 10 * 60 * 1000),
          },
          {
            partnerId: partnerProfile.id,
            latitude: 8.1834,
            longitude: 77.424,
            speed: 22.0,
            heading: 110,
            recordedAt: new Date(),
          },
        ],
      },
      payments: {
        create: {
          amountPaise: 16000,
          currency: 'INR',
          method: PaymentMethod.UPI,
          status: PaymentStatus.SUCCESS,
          provider: 'MOCK_UPI',
          providerTxnId: 'UPI-TXN-984210',
          paidAt: new Date(Date.now() - 40 * 60 * 1000),
        },
      },
    },
  });

  // 6. Delivered Sample Order (PDMS-10245)
  await prisma.order.upsert({
    where: { trackingNumber: 'PDMS-10245' },
    update: {},
    create: {
      trackingNumber: 'PDMS-10245',
      customerId: customer.id,
      partnerId: partnerProfile.id,
      status: OrderStatus.DELIVERED,
      deliverySpeed: DeliverySpeed.EXPRESS,
      pickupAddress: 'Vadasery Market, Nagercoil',
      pickupCity: 'Nagercoil',
      pickupLat: 8.1934,
      pickupLng: 77.4298,
      pickupContactName: 'Kavitha S.',
      pickupContactPhone: '9840998877',
      dropAddress: 'Chettikulam Road, Nagercoil',
      dropCity: 'Nagercoil',
      dropLat: 8.172,
      dropLng: 77.441,
      dropContactName: 'Devi Kumar',
      dropContactPhone: '9876543210',
      packageType: PackageType.SMALL_PARCEL,
      packageWeightKg: 0.8,
      packageDescription: 'Clothing and books',
      distanceKm: 4.2,
      estimatedDurationMins: 20,
      fareBasePaise: 8000,
      fareDistancePaise: 5000,
      fareWeightPaise: 0,
      fareSpeedPaise: 3000,
      fareTotalPaise: 16000,
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      events: {
        create: [
          {
            eventType: DeliveryEventType.BOOKING_CREATED,
            title: 'Booking Confirmed',
            description: 'Order placed',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          },
          {
            eventType: DeliveryEventType.DELIVERED,
            title: 'Delivered',
            description: 'Handed over to recipient',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      },
      payments: {
        create: {
          amountPaise: 16000,
          currency: 'INR',
          method: PaymentMethod.UPI,
          status: PaymentStatus.SUCCESS,
          provider: 'MOCK_UPI',
          providerTxnId: 'UPI-TXN-847291',
          paidAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      },
      earnings: {
        create: {
          partnerId: partnerProfile.id,
          grossAmountPaise: 16000,
          commissionPaise: 3200, // 20% commission
          netAmountPaise: 12800,  // ₹128 net earning
          status: EarningStatus.CREDITED,
        },
      },
    },
  });

  // 7. Initial Customer Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: customer.id,
        title: 'Delivery is on the way',
        message: 'Your parcel PDMS-10246 is currently in transit.',
        type: NotificationType.ORDER_STATUS,
        isRead: false,
        metadata: { orderId: activeOrder.id, trackingNumber: 'PDMS-10246' },
      },
      {
        userId: customer.id,
        title: 'Payment successful',
        message: 'Your payment of ₹160 for PDMS-10246 was successful.',
        type: NotificationType.PAYMENT,
        isRead: false,
        metadata: { orderId: activeOrder.id, amount: 160 },
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
