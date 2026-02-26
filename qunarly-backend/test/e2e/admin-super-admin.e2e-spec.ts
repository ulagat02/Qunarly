import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';
import { ensureSuperAdmin, ensureSuperAdminLogin } from './helpers/admin.helper';

describe('Super Admin bootstrap + admin APIs e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
  const listingIds: string[] = [];
  const orderIds: string[] = [];
  const hubIds: string[] = [];
  const routeIds: string[] = [];
  let adminEmail = '';
  let adminPassword = '';

  const initApp = async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const nestApp = moduleRef.createNestApplication();
    await nestApp.init();
    return nestApp;
  };

  beforeAll(async () => {
    adminEmail = 'superadmin-e2e@example.com';
    adminPassword = 'Admin123!';
    process.env.SUPER_ADMIN_EMAIL = adminEmail;
    process.env.SUPER_ADMIN_PASSWORD = adminPassword;
    process.env.SUPER_ADMIN_NAME = 'Бас Әкімші';
    app = await initApp();
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
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.carrierProfile.deleteMany({ where: { userId } });
        await prisma.profile.deleteMany({ where: { userId } });
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
      }
    }
    await app.close();
  });

  it('Bootstrap Super Admin is idempotent', async () => {
    const countBefore = await prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } });
    await app.close();
    app = await initApp();
    prisma = app.get(PrismaService);
    const countAfter = await prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } });
    expect(countAfter).toBe(countBefore);
  });

  it('Access control: normal user denied, super admin allowed', async () => {
    const normal = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(normal.email);

    await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', `Bearer ${normal.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', `Bearer ${await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword)}`)
      .expect(200);
  });

  it('Admin actions: reassign/unlock/cancel audited', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    const driver1 = await registerAndLogin(app, { role: UserRole.CARRIER });
    const driver2 = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(seller.email, buyer.email, driver1.email, driver2.email);

    const hubOrigin = await prisma.hub.create({
      data: { name: 'Admin Hub', normalizedName: 'admin hub', lat: 43.0, lng: 76.5, radiusKm: 0.8, isActive: true },
    });
    const hubCity = await prisma.hub.create({
      data: { name: 'Admin City Hub', normalizedName: 'admin city hub', lat: 43.3, lng: 76.95, radiusKm: 0.8, isActive: true },
    });
    hubIds.push(hubOrigin.id, hubCity.id);
    const route = await prisma.taxiRoute.create({
      data: {
        fromHubId: hubOrigin.id,
        toHubId: hubCity.id,
        routeType: 'DISTRICT_TO_CITY',
        status: 'ACTIVE',
      },
    });
    routeIds.push(route.id);

    const listing = await request(app.getHttpServer())
      .post('/market/listings')
      .set('Authorization', `Bearer ${seller.accessToken}`)
      .send({
        title: 'Admin Listing',
        description: 'E2E Listing',
        category: 'GRAIN',
        quantity: 10,
        unit: 'kg',
        price: 1000,
        currency: 'KZT',
        addressText: 'Listing Address',
        lat: 44.0,
        lng: 77.5,
      })
      .expect(201);
    const listingId = listing.body.id as string;
    listingIds.push(listingId);
    await prisma.productListing.update({ where: { id: listingId }, data: { lat: 44.0, lng: 77.5 } });

    const order = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        idempotencyKey: `e2e-${Date.now()}`,
        listingId,
        quantity: 1,
        destinationText: 'Buyer Destination',
        destLat: 43.26,
        destLng: 76.92,
      })
      .expect(201);
    const orderId = order.body.id as string;
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
      .send({ reason: 'manual' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/admin/delivery/legs/${blockedLeg.id}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        driverId: (await prisma.user.findUnique({ where: { email: driver2.email } }))?.id,
        reason: 'manual reassign',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'test' })
      .expect(201);

    const auditLogs = await prisma.auditLog.findMany({
      where: { action: { startsWith: 'admin.' } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
  });

  it('paginates /admin/orders with deterministic cursor', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(seller.email, buyer.email);
    const marker = `page-orders-${Date.now()}`;

    const listing = await request(app.getHttpServer())
      .post('/market/listings')
      .set('Authorization', `Bearer ${seller.accessToken}`)
      .send({
        title: `Pagination Listing ${marker}`,
        description: 'E2E Listing',
        category: 'GRAIN',
        quantity: 10,
        unit: 'kg',
        price: 1000,
        currency: 'KZT',
        addressText: 'Listing Address',
        lat: 44.2,
        lng: 77.7,
      })
      .expect(201);
    const listingId = listing.body.id as string;
    listingIds.push(listingId);
    await prisma.productListing.update({ where: { id: listingId }, data: { lat: 44.2, lng: 77.7 } });

    const orderA = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        idempotencyKey: `e2e-order-a-${Date.now()}`,
        listingId,
        quantity: 1,
        destinationText: 'Buyer Destination',
        destLat: 43.26,
        destLng: 76.92,
      })
      .expect(201);
    const orderB = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        idempotencyKey: `e2e-order-b-${Date.now()}`,
        listingId,
        quantity: 1,
        destinationText: 'Buyer Destination',
        destLat: 43.26,
        destLng: 76.92,
      })
      .expect(201);
    orderIds.push(orderA.body.id, orderB.body.id);

    const now = new Date();
    await prisma.order.update({ where: { id: orderA.body.id }, data: { createdAt: new Date(now.getTime() - 10_000) } });
    await prisma.order.update({ where: { id: orderB.body.id }, data: { createdAt: new Date(now.getTime() - 5_000) } });

    const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);
    const page1 = await request(app.getHttpServer())
      .get(`/admin/orders?limit=1&q=${encodeURIComponent(marker)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const page2 = await request(app.getHttpServer())
      .get(
        `/admin/orders?limit=1&q=${encodeURIComponent(marker)}&cursor=${encodeURIComponent(
          page1.body.nextCursor,
        )}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(page1.body.items[0].id).toBe(orderB.body.id);
    expect(page2.body.items[0].id).toBe(orderA.body.id);
    expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
  });
});
