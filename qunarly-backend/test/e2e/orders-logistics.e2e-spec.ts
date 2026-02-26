import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';
import { assertOrderRelations, fetchOrderWithRelations } from './helpers/db-assertions';
import { seedBaseEntities } from './helpers/seed.helper';

describe('Orders + logistics e2e', () => {
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
        await prisma.deal.deleteMany({
          where: { OR: [{ sellerId: user.id }, { buyerId: user.id }] },
        });
        await prisma.offer.deleteMany({
          where: { OR: [{ buyerId: user.id }, { listing: { sellerId: user.id } }] },
        });
        await prisma.notification.deleteMany({ where: { userId: user.id } });
        await prisma.carrierProfile.deleteMany({ where: { userId: user.id } });
        await prisma.profile.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('Listing flow: create/get/update and assert DB state', async () => {
    const seller = await registerAndLogin(app, { role: UserRole.FARMER });
    createdEmails.push(seller.email);

    const created = await request(app.getHttpServer())
      .post('/market/listings')
      .set('Authorization', `Bearer ${seller.accessToken}`)
      .send({
        title: 'E2E Wheat',
        description: 'Fresh',
        category: 'GRAIN',
        quantity: 25,
        unit: 'kg',
        price: 1500,
        currency: 'KZT',
        addressText: 'E2E Address',
      })
      .expect(201);

    const listingId = created.body.id as string;
    listingIds.push(listingId);

    await request(app.getHttpServer())
      .get(`/market/listings/${listingId}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/market/listings/${listingId}`)
      .set('Authorization', `Bearer ${seller.accessToken}`)
      .send({
        title: 'E2E Wheat Updated',
      })
      .expect(200);

    const listing = await prisma.productListing.findUnique({ where: { id: listingId } });
    expect(listing).toBeTruthy();
    expect(listing?.title).toBe('E2E Wheat Updated');
    expect(listing?.price).toBe(1500);
    expect(listing?.quantity).toBe(25);
  });

  it('Relay order flow: leg gating + commission ledger', async () => {
    const seed = await seedBaseEntities(app, prisma);
    createdEmails.push(seed.seller.email, seed.buyer.email, seed.driver.email);
    listingIds.push(seed.listing.id);

    const hubOrigin = await prisma.hub.create({
      data: { name: 'Origin Hub', normalizedName: 'origin hub', lat: 43.0, lng: 76.5, radiusKm: 0.8, isActive: true },
    });
    const hubCity = await prisma.hub.create({
      data: { name: 'City Hub', normalizedName: 'city hub', lat: 43.3, lng: 76.95, radiusKm: 0.8, isActive: true },
    });
    hubIds.push(hubOrigin.id, hubCity.id);
    const taxiRoute = await prisma.taxiRoute.create({
      data: {
        fromHubId: hubOrigin.id,
        toHubId: hubCity.id,
        routeType: 'DISTRICT_TO_CITY',
        status: 'ACTIVE',
      },
    });
    routeIds.push(taxiRoute.id);

    await prisma.productListing.update({
      where: { id: seed.listing.id },
      data: { lat: 44.0, lng: 77.5 },
    });

    const createdOrder = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${seed.buyer.accessToken}`)
      .send({
        idempotencyKey: `e2e-${Date.now()}`,
        listingId: seed.listing.id,
        quantity: 2,
        destinationText: 'E2E Buyer Destination',
        destLat: 43.26,
        destLng: 76.92,
      })
      .expect(201);

    const orderId = createdOrder.body.id as string;
    orderIds.push(orderId);
    expect(orderId).toBeTruthy();

    const order = await fetchOrderWithRelations(prisma, orderId);
    expect(order.status).toBe('PLACED');
    expect(order.commerceStatus).toBe('PAYMENT_PENDING');
    assertOrderRelations(order);
    expect(order.shipmentJob).toBeNull();
    const legsCountBefore = order.legs.length;
    expect(legsCountBefore).toBe(2);
    const [leg1, leg2] = order.legs;
    expect(leg1.price).toBe(250);
    expect(leg1.status).toBe('OFFERING');
    expect(leg2.price).toBe(1250);
    expect(leg2.status).toBe('ACCEPTED');

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/accept`)
      .set('Authorization', `Bearer ${seed.driver.accessToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/accept`)
      .set('Authorization', `Bearer ${seed.driver.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/start`)
      .set('Authorization', `Bearer ${seed.driver.accessToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/handoff/complete`)
      .set('Authorization', `Bearer ${seed.driver.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/arrive`)
      .set('Authorization', `Bearer ${seed.driver.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1.id}/handoff/complete`)
      .set('Authorization', `Bearer ${seed.driver.accessToken}`)
      .send({ lat: hubOrigin.lat, lng: hubOrigin.lng, proofCode: 'qr:test' })
      .expect(201);

    const afterHandoff = await fetchOrderWithRelations(prisma, orderId);
    const nextLeg = afterHandoff.legs.find((leg) => leg.id === leg2.id);
    expect(nextLeg?.status).toBe('OFFERING');

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2.id}/start`)
      .set('Authorization', `Bearer ${seed.driver.accessToken}`)
      .expect(400);

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

    const updated = await fetchOrderWithRelations(prisma, orderId);
    expect(updated.status).toBe('IN_FULFILLMENT');
    expect(updated.shipmentJob).toBeTruthy();
    expect(updated.shipmentJob?.orderId).toBe(orderId);
    expect(updated.legs.length).toBe(legsCountBefore);

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

    const leg1EventKey = `${orderId}:${leg1.id}:HANDOFF_COMPLETED:commission`;
    const leg2EventKey = `${orderId}:${leg2.id}:LEG_COMPLETED:commission`;
    const leg1Ledger = await prisma.proofEvent.findUnique({ where: { eventKey: leg1EventKey } });
    const leg2Ledger = await prisma.proofEvent.findUnique({ where: { eventKey: leg2EventKey } });
    expect(leg1Ledger).toBeTruthy();
    expect(leg2Ledger).toBeTruthy();
  });

  it('Relay order flow: origin hub creates single mainline leg', async () => {
    const seed = await seedBaseEntities(app, prisma);
    createdEmails.push(seed.seller.email, seed.buyer.email, seed.driver.email);
    listingIds.push(seed.listing.id);

    const hubOrigin = await prisma.hub.create({
      data: { name: 'Origin Hub 2', normalizedName: 'origin hub 2', lat: 43.1, lng: 76.7, radiusKm: 0.8, isActive: true },
    });
    const hubCity = await prisma.hub.create({
      data: { name: 'City Hub 2', normalizedName: 'city hub 2', lat: 43.4, lng: 76.99, radiusKm: 0.8, isActive: true },
    });
    hubIds.push(hubOrigin.id, hubCity.id);
    const taxiRoute = await prisma.taxiRoute.create({
      data: {
        fromHubId: hubOrigin.id,
        toHubId: hubCity.id,
        routeType: 'DISTRICT_TO_CITY',
        status: 'ACTIVE',
      },
    });
    routeIds.push(taxiRoute.id);

    await prisma.productListing.update({
      where: { id: seed.listing.id },
      data: { lat: hubOrigin.lat, lng: hubOrigin.lng },
    });

    const createdOrder = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${seed.buyer.accessToken}`)
      .send({
        idempotencyKey: `e2e-${Date.now()}-hub`,
        listingId: seed.listing.id,
        quantity: 1,
        destinationText: 'E2E Buyer Destination',
        destLat: 43.26,
        destLng: 76.92,
      })
      .expect(201);

    const orderId = createdOrder.body.id as string;
    orderIds.push(orderId);
    const order = await fetchOrderWithRelations(prisma, orderId);
    expect(order.legs.length).toBe(1);
    expect(order.legs[0].price).toBe(1250);
    expect(order.legs[0].status).toBe('OFFERING');
  });
});
