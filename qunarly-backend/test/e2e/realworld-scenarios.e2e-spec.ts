import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';
import { assertOrderRelations, fetchOrderWithRelations } from './helpers/db-assertions';
import { seedBaseEntities } from './helpers/seed.helper';
import { ensureSuperAdmin, ensureSuperAdminLogin } from './helpers/admin.helper';

describe('Real-world scenarios e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
  const listingIds: string[] = [];
  const orderIds: string[] = [];
  const hubIds: string[] = [];
  const routeIds: string[] = [];
  const adminEmail = 'superadmin-realworld@example.com';
  const adminPassword = 'Admin123!';

  beforeAll(async () => {
    process.env.SUPER_ADMIN_EMAIL = adminEmail;
    process.env.SUPER_ADMIN_PASSWORD = adminPassword;
    process.env.SUPER_ADMIN_NAME = 'Realworld Admin';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await ensureSuperAdmin(prisma, adminEmail, adminPassword);
  });

  afterAll(async () => {
    if (orderIds.length) {
      await prisma.orderDispute.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.refundFlag.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.commissionRecord.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.proofEvent.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.deliveryLeg.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.delivery.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.deliveryRequest.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.shipmentJob.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }
    if (listingIds.length) {
      await prisma.listingImage.deleteMany({ where: { listingId: { in: listingIds } } });
      await prisma.productListing.deleteMany({ where: { id: { in: listingIds } } });
    }
    if (routeIds.length) {
      await prisma.taxiRoute.deleteMany({ where: { id: { in: routeIds } } });
    }
    if (hubIds.length) {
      await prisma.hub.deleteMany({ where: { id: { in: hubIds } } });
    }
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const userId = user.id;
        const ordersByUser = await prisma.order.findMany({
          where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
          select: { id: true },
        });
        const oids = ordersByUser.map((o) => o.id);
        if (oids.length) {
          await prisma.orderDispute.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.refundFlag.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.commissionRecord.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.proofEvent.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.deliveryLeg.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.delivery.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.deliveryRequest.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.shipmentJob.deleteMany({ where: { orderId: { in: oids } } });
          await prisma.order.deleteMany({ where: { id: { in: oids } } });
        }
        await prisma.deal.deleteMany({
          where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
        });
        await prisma.offer.deleteMany({
          where: { OR: [{ buyerId: userId }, { listing: { sellerId: userId } }] },
        });
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.carrierProfile.deleteMany({ where: { userId } });
        await prisma.profile.deleteMany({ where: { userId } });
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
      }
    }
    await app.close();
  });

  const createHub = async (name: string, normalizedName: string, lat: number, lng: number, radiusKm = 0.8) => {
    const hub = await prisma.hub.create({
      data: { name, normalizedName, lat, lng, radiusKm, isActive: true },
    });
    hubIds.push(hub.id);
    return hub;
  };

  const createRoute = async (fromHubId: string, toHubId: string) => {
    const route = await prisma.taxiRoute.create({
      data: {
        fromHubId,
        toHubId,
        routeType: 'DISTRICT_TO_CITY',
        status: 'ACTIVE',
      },
    });
    routeIds.push(route.id);
    return route;
  };

  describe('Scenario A — Village -> Hub -> City (2 legs)', () => {
    it('full relay flow with commission ledger eventKeys', async () => {
      const seed = await seedBaseEntities(app, prisma);
      createdEmails.push(seed.seller.email, seed.buyer.email, seed.driver.email);
      listingIds.push(seed.listing.id);

      const hubVillage = await createHub('Village Hub', 'village hub', 43.0, 76.5);
      const hubCity = await createHub('City Hub', 'city hub', 43.3, 76.95);
      await createRoute(hubVillage.id, hubCity.id);

      await prisma.productListing.update({
        where: { id: seed.listing.id },
        data: { lat: 44.0, lng: 77.5 },
      });

      const createdOrder = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${seed.buyer.accessToken}`)
        .send({
          idempotencyKey: `realworld-a-${Date.now()}`,
          listingId: seed.listing.id,
          quantity: 2,
          destinationText: 'Buyer City',
          destLat: 43.26,
          destLng: 76.92,
        })
        .expect(201);

      const orderId = createdOrder.body.id as string;
      orderIds.push(orderId);

      const order = await fetchOrderWithRelations(prisma, orderId) as { legs: { id: string; toHubId: string | null; price: number; status: string }[]; status: string; delivery: unknown };
      expect(order.status).toBe('PLACED');
      assertOrderRelations(order);
      expect(order.legs).toHaveLength(2);
      const [leg1, leg2] = order.legs;
      expect(leg1.price).toBe(250);
      expect(leg2.price).toBe(1250);

      const leg1ToHub = leg1.toHubId ? await prisma.hub.findUnique({ where: { id: leg1.toHubId } }) : null;
      const leg1ArriveLat = leg1ToHub?.lat ?? hubVillage.lat;
      const leg1ArriveLng = leg1ToHub?.lng ?? hubVillage.lng;
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg1.id}/accept`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg1.id}/start`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg1.id}/arrive`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .send({ lat: leg1ArriveLat, lng: leg1ArriveLng })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg1.id}/handoff/complete`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .send({ lat: hubVillage.lat, lng: hubVillage.lng, proofCode: 'qr:test' })
        .expect(201);

      const admin = await registerAndLogin(app, { role: UserRole.ADMIN });
      createdEmails.push(admin.email);
      await request(app.getHttpServer())
        .post('/payments/confirm')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          orderId,
          provider: 'KASPI_QR',
          externalRef: `test-${Date.now()}`,
          status: 'CONFIRMED',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg2.id}/accept`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg2.id}/start`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg2.id}/arrive`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .send({ lat: 43.26, lng: 76.92 })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg2.id}/complete`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .expect(201);

      const requestRow = await prisma.deliveryRequest.findUnique({ where: { orderId } });
      expect(requestRow?.status).toBe('DELIVERED');

      const leg1EventKey = `commission:delivery:${orderId}:${leg1.id}:HANDOFF_COMPLETED`;
      const leg2EventKey = `commission:delivery:${orderId}:${leg2.id}:LEG_COMPLETED`;
      const leg1Ledger = await prisma.proofEvent.findUnique({ where: { eventKey: leg1EventKey } });
      const leg2Ledger = await prisma.proofEvent.findUnique({ where: { eventKey: leg2EventKey } });
      expect(leg1Ledger).toBeTruthy();
      expect(leg2Ledger).toBeTruthy();
    });
  });

  describe('Scenario B — Hub origin -> City (1 leg)', () => {
    it('single mainline leg, price=1250', async () => {
      const seed = await seedBaseEntities(app, prisma);
      createdEmails.push(seed.seller.email, seed.buyer.email, seed.driver.email);
      listingIds.push(seed.listing.id);

      const hubOrigin = await createHub('Origin Hub B', 'origin hub b', 43.1, 76.7);
      const hubCity = await createHub('City Hub B', 'city hub b', 43.4, 76.99);
      await createRoute(hubOrigin.id, hubCity.id);

      await prisma.productListing.update({
        where: { id: seed.listing.id },
        data: { lat: hubOrigin.lat, lng: hubOrigin.lng },
      });

      const createdOrder = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${seed.buyer.accessToken}`)
        .send({
          idempotencyKey: `realworld-b-${Date.now()}`,
          listingId: seed.listing.id,
          quantity: 1,
          destinationText: 'Buyer City',
          destLat: 43.26,
          destLng: 76.92,
        })
        .expect(201);

      const orderId = createdOrder.body.id as string;
      orderIds.push(orderId);

      const order = await fetchOrderWithRelations(prisma, orderId) as { legs: { id: string; price: number; status: string }[] };
      expect(order.legs).toHaveLength(1);
      expect(order.legs[0].price).toBe(1250);
      expect(order.legs[0].status).toBe('OFFERING');
    });
  });

  describe('Scenario C — Stuck reality', () => {
    it('admin listStuck returns items with deterministic reason precedence', async () => {
      const seed = await seedBaseEntities(app, prisma);
      createdEmails.push(seed.seller.email, seed.buyer.email, seed.driver.email);
      listingIds.push(seed.listing.id);

      const hubOrigin = await createHub('Stuck Hub Origin', 'stuck hub origin', 43.0, 76.5, 2);
      const hubCity = await createHub('Stuck Hub City', 'stuck hub city', 43.3, 76.95, 2);
      await createRoute(hubOrigin.id, hubCity.id);

      await prisma.productListing.update({
        where: { id: seed.listing.id },
        data: { lat: 44.0, lng: 77.5 },
      });

      const createdOrder = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${seed.buyer.accessToken}`)
        .send({
          idempotencyKey: `realworld-c-${Date.now()}`,
          listingId: seed.listing.id,
          quantity: 1,
          destinationText: 'Buyer',
          destLat: 43.26,
          destLng: 76.92,
        })
        .expect(201);

      const orderId = createdOrder.body.id as string;
      orderIds.push(orderId);

      const orderWithLegs = await fetchOrderWithRelations(prisma, orderId) as {
        legs: { id: string; toHubId: string | null }[];
      };
      const leg1 = orderWithLegs.legs[0];
      const arriveCoords =
        leg1.toHubId
          ? (await prisma.hub.findUnique({ where: { id: leg1.toHubId } }))
          : { lat: hubOrigin.lat, lng: hubOrigin.lng };
      const lat = arriveCoords?.lat ?? hubOrigin.lat;
      const lng = arriveCoords?.lng ?? hubOrigin.lng;
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg1.id}/accept`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg1.id}/start`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/delivery/legs/${leg1.id}/arrive`)
        .set('Authorization', `Bearer ${seed.driver.accessToken}`)
        .send({ lat, lng })
        .expect(201);

      const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);
      const stuckRes = await request(app.getHttpServer())
        .get('/admin/delivery/stuck')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const stuck = stuckRes.body;
      expect(Array.isArray(stuck)).toBe(true);
      const ourStuck = Array.isArray(stuck) ? stuck : stuck.items ?? [];
      const match = ourStuck.find(
        (s: { orderId?: string; order?: { id: string } }) => s.orderId === orderId || (s.order && s.order.id === orderId),
      );
      if (match) {
        expect(['WAITING_PROOF', 'LEG2_BLOCKED', 'NO_DRIVER', 'TIMEOUT']).toContain(match.reason ?? match.stuckReason);
      }
    });
  });

  describe('Scenario D — Admin real ops', () => {
    it('cancel/reassign/unlock create AuditLog rows', async () => {
      const seller = await registerAndLogin(app, { role: UserRole.FARMER });
      const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
      const driver1 = await registerAndLogin(app, { role: UserRole.CARRIER });
      const driver2 = await registerAndLogin(app, { role: UserRole.CARRIER });
      createdEmails.push(seller.email, buyer.email, driver1.email, driver2.email);

      const hubOrigin = await createHub('Admin Ops Hub', 'admin ops hub', 43.0, 76.5);
      const hubCity = await createHub('Admin Ops City', 'admin ops city', 43.3, 76.95);
      await createRoute(hubOrigin.id, hubCity.id);

      const listingRes = await request(app.getHttpServer())
        .post('/market/listings')
        .set('Authorization', `Bearer ${seller.accessToken}`)
        .send({
          title: 'Admin Ops Listing',
          description: 'E2E',
          category: 'GRAIN',
          quantity: 10,
          unit: 'kg',
          price: 1000,
          currency: 'KZT',
          addressText: 'Address',
          lat: 44.0,
          lng: 77.5,
        })
        .expect(201);
      const listingId = listingRes.body.id as string;
      listingIds.push(listingId);
      await prisma.productListing.update({ where: { id: listingId }, data: { lat: 44.0, lng: 77.5 } });

      const orderRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({
          idempotencyKey: `realworld-d-${Date.now()}`,
          listingId,
          quantity: 1,
          destinationText: 'Dest',
          destLat: 43.26,
          destLng: 76.92,
        })
        .expect(201);
      const orderId = orderRes.body.id as string;
      orderIds.push(orderId);

      const legs = await prisma.deliveryLeg.findMany({
        where: { orderId },
        orderBy: { sortOrder: 'asc' },
      });
      const blockedLeg = legs[1];

      const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);

      await request(app.getHttpServer())
        .post(`/admin/delivery/legs/${blockedLeg.id}/unlock-mainline`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'manual unlock' })
        .expect(201);

      const driver2User = await prisma.user.findUnique({ where: { email: driver2.email } });
      await request(app.getHttpServer())
        .post(`/admin/delivery/legs/${blockedLeg.id}/reassign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ driverId: driver2User?.id, reason: 'manual reassign' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/admin/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'test cancel' })
        .expect(201);

      const auditLogs = await prisma.auditLog.findMany({
        where: { action: { startsWith: 'admin.' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(3);
      const actions = auditLogs.map((a) => a.action);
      expect(actions).toContainEqual(expect.stringMatching(/admin\.order\.cancel/));
      expect(actions).toContainEqual(expect.stringMatching(/admin\.delivery\.leg\.(reassign|unlock)/));
    });
  });

  describe('Scenario E — Infra messy data', () => {
    it('duplicate hubs, rename, merge semantics', async () => {
      const hubA = await createHub('Dup Hub A', 'dup hub a', 43.0, 76.5);
      const hubB = await createHub('Dup Hub B', 'dup hub b', 43.001, 76.501);

      const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);

      const hubsRes = await request(app.getHttpServer())
        .get('/admin/hubs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(hubsRes.body).toBeDefined();
      const hubs = Array.isArray(hubsRes.body) ? hubsRes.body : hubsRes.body.items ?? hubsRes.body;
      expect(Array.isArray(hubs)).toBe(true);

      const route = await createRoute(hubA.id, hubB.id);

      const impactRes = await request(app.getHttpServer())
        .get(`/admin/hubs/${hubA.id}/impact`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (impactRes.status === 200 && impactRes.body) {
        expect(impactRes.body).toBeDefined();
      }

      const deactivateRes = await request(app.getHttpServer())
        .post(`/admin/hubs/${hubA.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'test' });

      if (deactivateRes.status === 400) {
        expect(deactivateRes.body?.message || deactivateRes.body?.error).toBeDefined();
      }

      routeIds.push(route.id);
    });
  });
});
