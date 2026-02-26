import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';

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

const expectStatus = (expected: number[]) => (res: request.Response) => {
  if (!expected.includes(res.status)) {
    throw new Error(`Expected status in [${expected.join(',')}], got ${res.status}`);
  }
};

describe('Full Jarmenke/Relay scenario e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
  const listingIds: string[] = [];
  const orderIds: string[] = [];
  const hubIds: string[] = [];
  const routeIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
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

  it('Full relay flow with gating + commission idempotency', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    const driver1 = await registerAndLogin(app, { role: UserRole.CARRIER });
    const driver2 = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(seller.email, buyer.email, driver1.email, driver2.email);

    const hubOrigin = await prisma.hub.create({
      data: { name: 'Scenario Hub', normalizedName: 'scenario hub', lat: 43.0, lng: 76.5, radiusKm: 0.8, isActive: true },
    });
    const hubCity = await prisma.hub.create({
      data: { name: 'Scenario City Hub', normalizedName: 'scenario city hub', lat: 43.3, lng: 76.95, radiusKm: 0.8, isActive: true },
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
      title: 'Relay Wheat',
      quantity: 10,
      price: 1000,
      lat: 44.0,
      lng: 77.5,
    });
    listingIds.push(listingId);
    await prisma.productListing.update({
      where: { id: listingId },
      data: { lat: 44.0, lng: 77.5 },
    });

    const orderId = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 2,
      destLat: 43.26,
      destLng: 76.92,
    });
    orderIds.push(orderId);

    const requestRow = await prisma.deliveryRequest.findUnique({ where: { orderId } });
    expect(requestRow).toBeTruthy();
    const legs = await prisma.deliveryLeg.findMany({
      where: { orderId },
      orderBy: { sortOrder: 'asc' },
    });
    expect(legs.length).toBe(2);
    const [leg1, leg2] = legs;
    expect(leg1.price).toBe(250);
    expect(leg2.price).toBe(1250);
    expect(leg2.status).toBe('ACCEPTED');

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/start`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(expectStatus([400, 403]));

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/accept`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/start`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/handoff/complete`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng })
      .expect(expectStatus([400, 403]));

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
            requestId: requestRow?.id,
            legId: leg1.id,
            lat: hubOrigin.lat,
            lng: hubOrigin.lng,
          },
        ],
      })
      .expect(201);

    const leg1ToHub = leg1.toHubId ? await prisma.hub.findUnique({ where: { id: leg1.toHubId } }) : null;
    const leg1ArriveLat = leg1ToHub?.lat ?? hubOrigin.lat;
    const leg1ArriveLng = leg1ToHub?.lng ?? hubOrigin.lng;
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/arrive`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: leg1ArriveLat, lng: leg1ArriveLng })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/handoff/complete`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng, proofCode: 'qr:ok' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/start`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(expectStatus([400, 403]));

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

    const delivered = await prisma.deliveryRequest.findUnique({ where: { orderId } });
    expect(delivered?.status).toBe('DELIVERED');

    const leg1EventKey = `commission:delivery:${orderId}:${leg1.id}:HANDOFF_COMPLETED`;
    const leg2EventKey = `commission:delivery:${orderId}:${leg2.id}:LEG_COMPLETED`;
    const leg1Commission = await prisma.proofEvent.findUnique({ where: { eventKey: leg1EventKey } });
    const leg2Commission = await prisma.proofEvent.findUnique({ where: { eventKey: leg2EventKey } });
    expect(leg1Commission).toBeTruthy();
    expect(leg2Commission).toBeTruthy();
    const leg1Meta = leg1Commission?.metaJson as Record<string, unknown> | undefined;
    const leg2Meta = leg2Commission?.metaJson as Record<string, unknown> | undefined;
    expect(leg1Meta?.amount).toBe(7.5);
    expect(leg2Meta?.amount).toBe(37.5);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/handoff/complete`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng, proofCode: 'qr:dup' })
      .expect(expectStatus([400, 403]));
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/complete`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(expectStatus([400, 403]));

    const leg1Events = await prisma.proofEvent.findMany({ where: { eventKey: leg1EventKey } });
    const leg2Events = await prisma.proofEvent.findMany({ where: { eventKey: leg2EventKey } });
    expect(leg1Events.length).toBe(1);
    expect(leg2Events.length).toBe(1);
  });

  it('Relay flow: origin hub creates single mainline leg', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(seller.email, buyer.email);

    const hubOrigin = await prisma.hub.create({
      data: { name: 'Scenario Hub 2', normalizedName: 'scenario hub 2', lat: 43.1, lng: 76.7, radiusKm: 0.8, isActive: true },
    });
    const hubCity = await prisma.hub.create({
      data: { name: 'Scenario City Hub 2', normalizedName: 'scenario city hub 2', lat: 43.4, lng: 76.99, radiusKm: 0.8, isActive: true },
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
      title: 'Relay Wheat Hub',
      quantity: 5,
      price: 900,
      lat: hubOrigin.lat,
      lng: hubOrigin.lng,
    });
    listingIds.push(listingId);
    await prisma.productListing.update({
      where: { id: listingId },
      data: { lat: hubOrigin.lat, lng: hubOrigin.lng },
    });

    const orderId = await createOrder(app, buyer.accessToken, {
      listingId,
      quantity: 1,
      destLat: 43.26,
      destLng: 76.92,
    });
    orderIds.push(orderId);

    const legs = await prisma.deliveryLeg.findMany({
      where: { orderId },
      orderBy: { sortOrder: 'asc' },
    });
    expect(legs.length).toBe(1);
    expect(legs[0].price).toBe(1250);
    expect(legs[0].status).toBe('OFFERING');
  });
});
