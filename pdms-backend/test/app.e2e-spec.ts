import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Nextus PDMS End-to-End API Suite', () => {
  let app: INestApplication;
  let customerToken: string;
  let customerRefreshToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication & Sessions', () => {
    it('POST /api/v1/auth/login - fails with invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: '9876543210', password: 'WrongPassword' })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
    });

    it('POST /api/v1/auth/login - succeeds with seeded customer credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: '9876543210', password: 'Nextus@123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.role).toBe('CUSTOMER');

      customerToken = res.body.data.accessToken;
      customerRefreshToken = res.body.data.refreshToken;
    });

    it('POST /api/v1/auth/login - succeeds with admin credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: '9876500000', password: 'Admin@123456' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
      adminToken = res.body.data.accessToken;
    });

    it('POST /api/v1/auth/refresh - rotates refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: customerRefreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // New refresh token should be different from previous
      expect(res.body.data.refreshToken).not.toBe(customerRefreshToken);
    });
  });

  describe('Pricing & Quotations', () => {
    it('POST /api/v1/pricing/quote - calculates verified fare', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/pricing/quote')
        .send({
          pickupAddress: 'Parvathipuram, Nagercoil',
          dropAddress: 'Tower Junction, Nagercoil',
          pickupLat: 8.1883,
          pickupLng: 77.4119,
          dropLat: 8.1804,
          dropLng: 77.4334,
          deliverySpeed: 'EXPRESS',
          packageType: 'SMALL_PARCEL',
          packageWeightKg: 1.0,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.baseFarePaise).toBeDefined();
      expect(res.body.data.totalFarePaise).toBeGreaterThan(0);
      expect(res.body.data.totalFareRupees).toBe(res.body.data.totalFarePaise / 100);
    });
  });

  describe('Orders & Role-Based Authorization', () => {
    it('GET /api/v1/orders/track/PDMS-10246 - public tracking endpoint succeeds', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/orders/track/PDMS-10246')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.trackingNumber).toBe('PDMS-10246');
      expect(res.body.data.events.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/admin/dashboard - rejects unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .expect(401);
    });

    it('GET /api/v1/admin/dashboard - rejects CUSTOMER role with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('GET /api/v1/admin/dashboard - allows ADMIN role with 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalOrders).toBeGreaterThan(0);
    });
  });

  describe('Payments & Webhooks', () => {
    it('POST /api/v1/payments/webhook - processes idempotent webhook event', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          event: 'payment.success',
          paymentId: 'non-existent',
          status: 'SUCCESS',
        })
        .expect(404); // returns 404 for non-existent payment safely without crashing
    });
  });
});
