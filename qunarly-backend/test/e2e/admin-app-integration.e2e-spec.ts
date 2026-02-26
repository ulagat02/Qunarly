import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { ensureSuperAdminLogin } from './helpers/admin.helper';
import { UserRole, DeliveryLegStatus } from '@prisma/client';

const createListing = async (
  app: INestApplication,
  accessToken: string,
  payload: { title: string; quantity: number; price: number; lat: number; lng: number },
) => {
  const response = await request(app.getHttpServer())
    .post('/market/listings')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: payload.title,
      description: 'E2E Listing',
      category: 'GRAIN',
      quantity: payload.quantity,
      unit: 'kg',
      price: payload.price,
      currency: 'KZT',
      addressText: 'Listing Address',
      lat: payload.lat,
      lng: payload.lng,
    })
    .expect(201);
  return response.body.id as string;
};

const createOrder = async (
  app: INestApplication,
  accessToken: string,
  payload: { listingId: string; quantity: number; destLat: number; destLng: number },
) => {
  const response = await request(app.getHttpServer())
    .post('/orders')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      idempotencyKey: `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      listingId: payload.listingId,
      quantity: payload.quantity,
      destinationText: 'Buyer Destination',
      destLat: payload.destLat,
      destLng: payload.destLng,
    })
    .expect(201);
  return response.body.id as string;
};

const setListingCoords = async (prisma: PrismaService, listingId: string, lat: number, lng: number) => {
  await prisma.productListing.update({
    where: { id: listingId },
    data: { lat, lng },
  });
};

const expectStatus = (expected: number[]) => (res: request.Response) => {
  if (!expected.includes(res.status)) {
    throw new Error(`Expected status in [${expected.join(',')}], got ${res.status}`);
  }
};

describe('Admin ↔ App Integration e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  const createdEmails: string[] = [];
  const listingIds: string[] = [];
  const orderIds: string[] = [];
  const hubIds: string[] = [];
  const routeIds: string[] = [];
  const accessListIds: string[] = [];
  const disputeIds: string[] = [];
  const refundFlagIds: string[] = [];
  const slaIds: string[] = [];

  beforeAll(async () => {
    process.env.ADMIN_STATS_CACHE_TTL_SECONDS = '0';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    adminToken = await ensureSuperAdminLogin(app, prisma, 'admin-e2e@example.com', 'Admin123!');
  });

  afterAll(async () => {
    if (refundFlagIds.length) {
      await prisma.refundFlag.deleteMany({ where: { id: { in: refundFlagIds } } });
    }
    if (disputeIds.length) {
      await prisma.orderDispute.deleteMany({ where: { id: { in: disputeIds } } });
    }
    if (orderIds.length) {
      await prisma.commissionRecord.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.proofEvent.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.deliveryLeg.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.delivery.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.deliveryRequest.deleteMany({ where: { orderId: { in: orderIds } } });
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
    if (accessListIds.length) {
      await prisma.accessListEntry.deleteMany({ where: { id: { in: accessListIds } } });
    }
    if (slaIds.length) {
      await prisma.deliverySlaConfig.deleteMany({ where: { id: { in: slaIds } } });
    }
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const relatedOrders = await prisma.order.findMany({
          where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
          select: { id: true },
        });
        const relatedOrderIds = relatedOrders.map((order) => order.id);
        if (relatedOrderIds.length) {
          await prisma.commissionRecord.deleteMany({ where: { orderId: { in: relatedOrderIds } } });
          await prisma.proofEvent.deleteMany({ where: { orderId: { in: relatedOrderIds } } });
          await prisma.deliveryLeg.deleteMany({ where: { orderId: { in: relatedOrderIds } } });
          await prisma.delivery.deleteMany({ where: { orderId: { in: relatedOrderIds } } });
          await prisma.deliveryRequest.deleteMany({ where: { orderId: { in: relatedOrderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: relatedOrderIds } } });
        }
        await prisma.notification.deleteMany({ where: { userId: user.id } });
        await prisma.carrierProfile.deleteMany({ where: { userId: user.id } });
        await prisma.profile.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('E) Auth/Guard correctness', async () => {
    await request(app.getHttpServer()).get('/admin/orders').expect(401);

    const normal = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(normal.email);
    await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', `Bearer ${normal.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('A) Admin cancel order reflects in app and audit', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(seller.email, buyer.email);

    const listingId = await createListing(app, seller.accessToken, {
      title: 'Admin Cancel Listing',
      quantity: 5,
      price: 1000,
      lat: 43.2,
      lng: 76.9,
    });
    listingIds.push(listingId);
    await setListingCoords(prisma, listingId, 43.2, 76.9);

    const orderId = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 1,
      destLat: 43.25,
      destLng: 76.92,
    });
    orderIds.push(orderId);

    await request(app.getHttpServer())
      .post(`/admin/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Admin cancel test' })
      .expect(201);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe('CANCELLED');

    const buyerView = await request(app.getHttpServer())
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);
    expect(buyerView.body.status).toBe('CANCELLED');

    const sellerView = await request(app.getHttpServer())
      .get('/orders/my')
      .set('Authorization', `Bearer ${seller.accessToken}`)
      .expect(200);
    const sellerOrder = sellerView.body.find((row: any) => row.id === orderId);
    expect(sellerOrder?.status).toBe('CANCELLED');

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'admin.order.cancel', metaJson: { path: ['targetId'], equals: orderId } },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeTruthy();
  });

  it('B) Admin relay operations reflect in driver views and audit', async () => {
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

    const listingId = await createListing(app, seller.accessToken, {
      title: 'Admin Relay Listing',
      quantity: 6,
      price: 900,
      lat: 44.0,
      lng: 77.5,
    });
    listingIds.push(listingId);
    await setListingCoords(prisma, listingId, 44.0, 77.5);

    const orderId = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 2,
      destLat: 43.26,
      destLng: 76.92,
    });
    orderIds.push(orderId);

    const legs = await prisma.deliveryLeg.findMany({
      where: { orderId },
      orderBy: { sortOrder: 'asc' },
    });
    expect(legs.length).toBe(2);
    const [leg1, leg2] = legs;

    await request(app.getHttpServer())
      .post(`/admin/delivery/legs/${leg2.id}/unlock-mainline`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Unlock for admin test' })
      .expect(201);

    const unlocked = await prisma.deliveryLeg.findUnique({ where: { id: leg2.id } });
    expect(unlocked?.status).toBe(DeliveryLegStatus.OFFERING);

    const driver2Row = await prisma.user.findUnique({ where: { email: driver2.email } });
    if (!driver2Row) {
      throw new Error('Driver2 not found');
    }
    const auditUnlock = await prisma.auditLog.findFirst({
      where: { action: 'admin.delivery.leg.unlock', metaJson: { path: ['targetId'], equals: leg2.id } },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditUnlock).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/accept`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/start`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post('/delivery/proof-events/batch')
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({
        events: [
          {
            eventType: 'LEG_ARRIVED',
            entityType: 'LEG',
            entityId: leg1.id,
            orderId,
            requestId: leg1.requestId,
            legId: leg1.id,
            lat: hubOrigin.lat,
            lng: hubOrigin.lng,
          },
        ],
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/arrive`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/handoff/complete`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng, proofCode: 'qr:ok' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/admin/delivery/legs/${leg2.id}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Assign to driver2', driverId: driver2Row.id })
      .expect(201);
    const reassigned = await prisma.deliveryLeg.findUnique({ where: { id: leg2.id } });
    expect(reassigned?.driverId).toBe(driver2Row.id);

    const mine = await request(app.getHttpServer())
      .get('/delivery/legs/mine')
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(200);
    const mineIds = mine.body.map((row: any) => row.id);
    expect(mineIds).toContain(leg2.id);

    const auditReassign = await prisma.auditLog.findFirst({
      where: { action: 'admin.delivery.leg.reassign', metaJson: { path: ['targetId'], equals: leg2.id } },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditReassign).toBeTruthy();

    const available = await request(app.getHttpServer())
      .get('/delivery/legs/available')
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(200);
    const availableIds = available.body.map((row: any) => row.id);
    expect(availableIds).not.toContain(leg2.id);
  });

  it('C) Commission ledger integration and stats update', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    const driver1 = await registerAndLogin(app, { role: UserRole.CARRIER });
    const driver2 = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(seller.email, buyer.email, driver1.email, driver2.email);

    const hubOrigin = await prisma.hub.create({
      data: { name: 'Stats Hub', normalizedName: 'stats hub', lat: 43.1, lng: 76.6, radiusKm: 0.8, isActive: true },
    });
    const hubCity = await prisma.hub.create({
      data: { name: 'Stats City Hub', normalizedName: 'stats city hub', lat: 43.35, lng: 76.95, radiusKm: 0.8, isActive: true },
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

    const listingId = await createListing(app, seller.accessToken, {
      title: 'Commission Listing',
      quantity: 10,
      price: 1000,
      lat: 44.2,
      lng: 77.6,
    });
    listingIds.push(listingId);
    await setListingCoords(prisma, listingId, 44.2, 77.6);

    const orderId = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 2,
      destLat: 43.26,
      destLng: 76.92,
    });
    orderIds.push(orderId);

    const statsBefore = await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const commissionBefore = statsBefore.body.commissionToday ?? 0;

    const legs = await prisma.deliveryLeg.findMany({
      where: { orderId },
      orderBy: { sortOrder: 'asc' },
    });
    const [leg1, leg2] = legs;

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/accept`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/start`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post('/delivery/proof-events/batch')
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({
        events: [
          {
            eventType: 'LEG_ARRIVED',
            entityType: 'LEG',
            entityId: leg1.id,
            orderId,
            requestId: leg1.requestId,
            legId: leg1.id,
            lat: hubOrigin.lat,
            lng: hubOrigin.lng,
          },
        ],
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/arrive`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/handoff/complete`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng, proofCode: 'qr:ok' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/accept`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/start`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/arrive`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .send({ lat: 43.26, lng: 76.92 })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/complete`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(201);

    const leg1EventKey = `commission:delivery:${orderId}:${leg1.id}:HANDOFF_COMPLETED`;
    const leg2EventKey = `commission:delivery:${orderId}:${leg2.id}:LEG_COMPLETED`;
    const leg1Events = await prisma.proofEvent.findMany({ where: { eventKey: leg1EventKey } });
    const leg2Events = await prisma.proofEvent.findMany({ where: { eventKey: leg2EventKey } });
    expect(leg1Events.length).toBe(1);
    expect(leg2Events.length).toBe(1);

    const adminOrder = await request(app.getHttpServer())
      .get(`/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminOrder.body.commissionEntries?.length).toBeGreaterThanOrEqual(2);

    const statsAfter = await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const commissionAfter = statsAfter.body.commissionToday ?? 0;
    expect(commissionAfter).toBeGreaterThanOrEqual(commissionBefore + 45 - 0.01);

    await request(app.getHttpServer())
      .get('/admin/exports/stats?format=csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/admin/exports/commission?format=csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('D) Stuck triage reasons and precedence', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    const driver = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(seller.email, buyer.email, driver.email);

    const listingId = await createListing(app, seller.accessToken, {
      title: 'Stuck Listing',
      quantity: 20,
      price: 500,
      lat: 44.5,
      lng: 77.1,
    });
    listingIds.push(listingId);
    await setListingCoords(prisma, listingId, 44.5, 77.1);

    const orderId = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 1,
      destLat: 43.5,
      destLng: 76.7,
    });
    orderIds.push(orderId);

    const legs = await prisma.deliveryLeg.findMany({ where: { orderId }, orderBy: { sortOrder: 'asc' } });
    const [leg1, leg2] = legs;
    const oldDate = new Date(Date.now() - 60 * 60 * 1000);

    await prisma.deliveryLeg.update({
      where: { id: leg1.id },
      data: { status: DeliveryLegStatus.ARRIVED, updatedAt: oldDate },
    });
    await prisma.deliveryLeg.update({
      where: { id: leg2.id },
      data: { status: DeliveryLegStatus.ACCEPTED, driverId: null, updatedAt: oldDate },
    });

    const orderId2 = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 1,
      destLat: 43.6,
      destLng: 76.8,
    });
    orderIds.push(orderId2);
    const legs2 = await prisma.deliveryLeg.findMany({ where: { orderId: orderId2 }, orderBy: { sortOrder: 'asc' } });
    await prisma.deliveryLeg.update({
      where: { id: legs2[0].id },
      data: { status: DeliveryLegStatus.OFFERING, updatedAt: oldDate, driverId: null },
    });

    const orderId3 = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 1,
      destLat: 43.7,
      destLng: 76.85,
    });
    orderIds.push(orderId3);
    const legs3 = await prisma.deliveryLeg.findMany({ where: { orderId: orderId3 }, orderBy: { sortOrder: 'asc' } });
    const driverRow = await prisma.user.findUnique({ where: { email: driver.email } });
    if (!driverRow) {
      throw new Error('Driver not found');
    }
    await prisma.deliveryLeg.update({
      where: { id: legs3[0].id },
      data: { status: DeliveryLegStatus.STARTED, updatedAt: oldDate, driverId: driverRow.id },
    });

    const stuck = await request(app.getHttpServer())
      .get('/admin/delivery/stuck')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const byLegId = new Map<string, string>();
    stuck.body.forEach((item: any) => {
      if (item.legId) byLegId.set(item.legId, item.reason);
    });

    expect(byLegId.get(leg1.id)).toBe('WAITING_PROOF');
    expect(byLegId.get(leg2.id)).toBe('LEG2_BLOCKED');
    expect(byLegId.get(legs2[0].id)).toBe('NO_DRIVER');
    expect(byLegId.get(legs3[0].id)).toBe('TIMEOUT');
  });

  it('F) Fraud endpoints and access list availability', async () => {
    const access = await request(app.getHttpServer())
      .post('/admin/access-list')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        listType: 'BLACKLIST',
        targetType: 'USER_ID',
        targetValue: 'test-user-id',
        reason: 'test access list',
      })
      .expect(201);
    accessListIds.push(access.body.id);

    await request(app.getHttpServer())
      .get('/admin/access-list')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/admin/fraud/signals')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('Pagination order is stable for admin orders', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(seller.email, buyer.email);

    const listingId = await createListing(app, seller.accessToken, {
      title: 'Pagination Listing',
      quantity: 2,
      price: 100,
      lat: 43.9,
      lng: 76.95,
    });
    listingIds.push(listingId);
    await setListingCoords(prisma, listingId, 43.9, 76.95);
    const orderA = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 1,
      destLat: 43.9,
      destLng: 76.95,
    });
    const orderB = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 1,
      destLat: 43.9,
      destLng: 76.95,
    });
    orderIds.push(orderA, orderB);

    const page1 = await request(app.getHttpServer())
      .get('/admin/orders?limit=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const page1Id = page1.body.items[0]?.id;
    const nextCursor = page1.body.nextCursor;
    expect(page1Id).toBeTruthy();
    expect(nextCursor).toBeTruthy();

    const page2 = await request(app.getHttpServer())
      .get(`/admin/orders?limit=1&cursor=${encodeURIComponent(nextCursor)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const page2Id = page2.body.items[0]?.id;
    expect(page2Id).toBeTruthy();
    expect(page2Id).not.toBe(page1Id);
  });
});
