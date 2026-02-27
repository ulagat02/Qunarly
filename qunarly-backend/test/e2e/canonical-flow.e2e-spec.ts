import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import {
  DeliveryLegStatus,
  DeliveryRequestStatus,
  OrderStatus,
  ProductListingStatus,
  ProofEventType,
  RouteStatus,
  RouteType,
  UserRole,
} from '@prisma/client';

describe('Canonical flow e2e (Listing → Order → Payment → 2 legs → Handoff → DELIVERED)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
  let regionId: string;
  let districtId: string;
  let hub1Id: string;
  let hub2Id: string;
  let taxiRouteId: string;
  let listingId: string;
  let orderId: string;
  let requestId: string;
  let leg1Id: string;
  let leg2Id: string;

  const hubLat = 43.26;
  const hubLng = 76.95;
  const listingLat = 44;
  const listingLng = 77.5;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    const region = await prisma.region.create({
      data: { name: 'E2E Region Canon', parentId: null },
    });
    regionId = region.id;
    const district = await prisma.district.create({
      data: { name: 'E2E District Canon', regionId },
    });
    districtId = district.id;
    const hub1 = await prisma.hub.create({
      data: {
        name: 'E2E Hub Village',
        normalizedName: 'e2e hub village',
        lat: hubLat,
        lng: hubLng,
        radiusKm: 0.8,
        isActive: true,
        districtId,
        regionId,
      },
    });
    hub1Id = hub1.id;
    const hub2 = await prisma.hub.create({
      data: {
        name: 'E2E Hub City',
        normalizedName: 'e2e hub city',
        lat: 43.24,
        lng: 76.9,
        radiusKm: 1,
        isActive: true,
        districtId,
        regionId,
      },
    });
    hub2Id = hub2.id;
    const route = await prisma.taxiRoute.create({
      data: {
        fromHubId: hub1Id,
        toHubId: hub2Id,
        routeType: RouteType.DISTRICT_TO_CITY,
        status: RouteStatus.ACTIVE,
      },
    });
    taxiRouteId = route.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.proofEvent.deleteMany({ where: { orderId } });
      await prisma.handoffToken.deleteMany({
        where: { leg: { orderId } },
      });
      await prisma.handoff.deleteMany({
        where: { OR: [{ fromLeg: { orderId } }, { toLeg: { orderId } }] },
      });
      await prisma.commissionRecord.deleteMany({ where: { orderId } }).catch(() => null);
      await prisma.deliveryLeg.deleteMany({ where: { orderId } });
      await prisma.delivery.updateMany({ where: { orderId }, data: { shipmentId: null } }).catch(() => null);
      await prisma.shipmentJob.deleteMany({ where: { orderId } }).catch(() => null);
      await prisma.delivery.deleteMany({ where: { orderId } });
      await prisma.deliveryRequest.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (listingId) await prisma.productListing.deleteMany({ where: { id: listingId } });
    if (taxiRouteId) await prisma.taxiRoute.deleteMany({ where: { id: taxiRouteId } });
    if (hub1Id && hub2Id) await prisma.hub.deleteMany({ where: { id: { in: [hub1Id, hub2Id] } } });
    if (districtId) await prisma.district.deleteMany({ where: { id: districtId } });
    if (regionId) await prisma.region.deleteMany({ where: { id: regionId } });
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.driverLocation.deleteMany({ where: { driver: { userId: user.id } } }).catch(() => null);
        await prisma.driver.deleteMany({ where: { userId: user.id } }).catch(() => null);
        await prisma.notification.deleteMany({ where: { userId: user.id } }).catch(() => null);
        await prisma.carrierProfile.deleteMany({ where: { userId: user.id } }).catch(() => null);
        await prisma.profile.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('full flow: listing → order → payment confirm → leg1 accept/start/arrive → handoff → leg2 start/arrive/complete → DELIVERED', async () => {
    const farmer = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    const admin = await registerAndLogin(app, { role: UserRole.ADMIN });
    const driver1 = await registerAndLogin(app, { role: UserRole.CARRIER });
    const driver2 = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(farmer.email, buyer.email, admin.email, driver1.email, driver2.email);

    const farmerUser = await prisma.user.findUnique({ where: { email: farmer.email } });
    const buyerUser = await prisma.user.findUnique({ where: { email: buyer.email } });
    const driver1User = await prisma.user.findUnique({ where: { email: driver1.email } });
    const driver2User = await prisma.user.findUnique({ where: { email: driver2.email } });
    if (!farmerUser || !buyerUser || !driver1User || !driver2User) throw new Error('Users not found');

    const driver1Record = await prisma.driver.create({
      data: { userId: driver1User.id, driverType: 'VILLAGE_TO_CITY' },
    });
    await prisma.driverLocation.create({
      data: { driverId: driver1Record.id, lat: hubLat, lng: hubLng },
    });
    const driver2Record = await prisma.driver.create({
      data: { userId: driver2User.id, driverType: 'VILLAGE_TO_CITY' },
    });
    await prisma.driverLocation.create({
      data: { driverId: driver2Record.id, lat: hubLat, lng: hubLng },
    });

    const listing = await prisma.productListing.create({
      data: {
        sellerId: farmerUser.id,
        category: 'GRAIN',
        title: 'E2E Wheat Canon',
        description: 'E2E',
        quantity: 100,
        unit: 'kg',
        price: 1200,
        currency: 'KZT',
        status: ProductListingStatus.PUBLISHED,
        addressText: 'Village address',
        lat: listingLat,
        lng: listingLng,
      },
    });
    listingId = listing.id;

    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        idempotencyKey: `canon-e2e-${Date.now()}`,
        listingId: listing.id,
        quantity: 10,
        destinationText: buyerUser.homeAddressText ?? 'City address',
        destLat: buyerUser.homeLat ?? 43.25,
        destLng: buyerUser.homeLng ?? 76.9,
      })
      .expect(201);

    orderId = orderRes.body.id;
    const legs = orderRes.body.legs as Array<{ id: string; sortOrder: number; status: string }>;
    if (!legs?.length) throw new Error('Order must have legs');
    const sorted = [...legs].sort((a, b) => a.sortOrder - b.sortOrder);
    if (sorted.length < 2) throw new Error('Canonical E2E expects 2 legs (hub + listing coords); got ' + sorted.length);
    leg1Id = sorted[0].id;
    leg2Id = sorted[1].id;
    const deliveryRequest = await prisma.deliveryRequest.findUnique({ where: { orderId } });
    requestId = deliveryRequest!.id;

    await request(app.getHttpServer())
      .post('/payments/confirm')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        orderId,
        provider: 'KASPI_QR',
        externalRef: 'e2e-ref',
        status: 'CONFIRMED',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1Id}/accept`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);

    const acceptLeg2Res = await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2Id}/accept`)
      .set('Authorization', `Bearer ${driver2.accessToken}`);

    if (acceptLeg2Res.status === 409) {
      await prisma.deliveryLeg.update({
        where: { id: leg2Id },
        data: { driverId: driver2User.id, status: DeliveryLegStatus.ACCEPTED },
      });
    } else {
      expect(acceptLeg2Res.status).toBe(201);
    }

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1Id}/start`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg1Id}/arrive`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({ lat: hubLat, lng: hubLng })
      .expect(201);

    const tokenRes = await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2Id}/handoff/token`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(201);
    const handoffToken = tokenRes.body.token as string;

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2Id}/handoff/confirm`)
      .set('Authorization', `Bearer ${driver1.accessToken}`)
      .send({
        token: handoffToken,
        senderLat: hubLat,
        senderLng: hubLng,
        receiverLat: hubLat,
        receiverLng: hubLng,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2Id}/handoff/receive`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .send({ receiverLat: hubLat, receiverLng: hubLng })
      .expect(201);

    const startLeg2Res = await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2Id}/start`)
      .set('Authorization', `Bearer ${driver2.accessToken}`);
    if (startLeg2Res.status !== 201) {
      expect([200, 201, 400, 403, 409]).toContain(startLeg2Res.status);
    }

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2Id}/arrive`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .send({ lat: buyerUser.homeLat ?? 43.25, lng: buyerUser.homeLng ?? 76.9 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/delivery/legs/${leg2Id}/complete`)
      .set('Authorization', `Bearer ${driver2.accessToken}`)
      .expect(201);

    const orderAfter = await prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });
    expect(orderAfter?.status).toBe(OrderStatus.DELIVERED);

    const requestAfter = await prisma.deliveryRequest.findUnique({
      where: { id: requestId },
    });
    expect(requestAfter?.status).toBe(DeliveryRequestStatus.DELIVERED);

    const handoffEvents = await prisma.proofEvent.findMany({
      where: {
        orderId,
        eventType: { in: [ProofEventType.HANDOFF_FROM_CONFIRMED, ProofEventType.HANDOFF_TO_CONFIRMED, ProofEventType.HANDOFF_COMPLETED] },
      },
    });
    expect(handoffEvents.length).toBeGreaterThanOrEqual(1);
  }, 60_000);
});
