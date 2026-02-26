import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';

describe('Taxi queue state machine e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
  const hubIds: string[] = [];
  const routeIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.queueEvent.deleteMany({});
    await prisma.offerAcceptIdempotency.deleteMany({});
    await prisma.driverOffer.deleteMany({});
    await prisma.driverQueue.deleteMany({});
    await prisma.rideRequest.deleteMany({});
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
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.carrierProfile.deleteMany({ where: { userId } });
        await prisma.profile.deleteMany({ where: { userId } });
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
      }
    }
    await app.close();
  });

  const createHubsAndRoute = async () => {
    const hub1 = await prisma.hub.create({
      data: { name: 'Taxi Hub A', normalizedName: 'taxi hub a', lat: 43.2, lng: 76.9, radiusKm: 0.8, isActive: true },
    });
    const hub2 = await prisma.hub.create({
      data: { name: 'Taxi Hub B', normalizedName: 'taxi hub b', lat: 43.3, lng: 77.0, radiusKm: 0.8, isActive: true },
    });
    hubIds.push(hub1.id, hub2.id);
    const route = await prisma.taxiRoute.create({
      data: { fromHubId: hub1.id, toHubId: hub2.id, routeType: 'DISTRICT_TO_CITY', status: 'ACTIVE' },
    });
    routeIds.push(route.id);
    return { hub1, hub2, route };
  };

  it('join queue -> ping -> list shows driver with expiresAt', async () => {
    const driver = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(driver.email);
    const { route } = await createHubsAndRoute();

    await request(app.getHttpServer())
      .post('/drivers/queue/join')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ routeId: route.id, capacity: 4 })
      .expect(201);

    const statusRes = await request(app.getHttpServer())
      .get('/drivers/queue/status')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .query({ routeId: route.id })
      .expect(200);

    expect(statusRes.body.queue).toBeTruthy();
    expect(statusRes.body.queue.status).toBe('IN_QUEUE');
    expect(statusRes.body.queue.expiresAt).toBeTruthy();

    await request(app.getHttpServer())
      .post('/drivers/queue/ping')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ routeId: route.id })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/taxi/queue/drivers')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .query({ routeId: route.id })
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body[0].driverId).toBeTruthy();

    await prisma.driverQueue.updateMany({
      where: { routeId: route.id },
      data: { status: 'REMOVED_INACTIVE' },
    });
  });

  it('createRequest with clientRequestId is idempotent', async () => {
    const passenger = await registerAndLogin(app, { role: UserRole.FARMER });
    const driver = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(passenger.email, driver.email);
    const { route } = await createHubsAndRoute();

    await request(app.getHttpServer())
      .post('/drivers/queue/join')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ routeId: route.id, capacity: 4 })
      .expect(201);

    const clientRequestId = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const body = {
      routeId: route.id,
      pickupText: 'E2E pickup',
      seats: 1,
      cargoType: 'NONE',
      departureType: 'TODAY' as const,
      clientRequestId,
    };

    const res1 = await request(app.getHttpServer())
      .post('/taxi/requests')
      .set('Authorization', `Bearer ${passenger.accessToken}`)
      .send(body)
      .expect(201);

    const res2 = await request(app.getHttpServer())
      .post('/taxi/requests')
      .set('Authorization', `Bearer ${passenger.accessToken}`)
      .send(body)
      .expect(201);

    expect(res1.body.id).toBe(res2.body.id);
    expect(res1.body.clientRequestId).toBe(clientRequestId);

    await prisma.driverOffer.deleteMany({ where: { requestId: res1.body.id } });
    await prisma.rideRequest.deleteMany({ where: { id: res1.body.id } });
    await prisma.driverQueue.updateMany({ where: { routeId: route.id }, data: { status: 'REMOVED_INACTIVE' } });
  });

  it('accept offer with actionId is idempotent', async () => {
    const passenger = await registerAndLogin(app, { role: UserRole.FARMER });
    const driver = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(passenger.email, driver.email);
    const { route } = await createHubsAndRoute();

    await request(app.getHttpServer())
      .post('/drivers/queue/join')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ routeId: route.id, capacity: 4 })
      .expect(201);

    const createRes = await request(app.getHttpServer())
      .post('/taxi/requests')
      .set('Authorization', `Bearer ${passenger.accessToken}`)
      .send({
        routeId: route.id,
        pickupText: 'E2E pickup',
        seats: 1,
        cargoType: 'NONE',
        departureType: 'TODAY',
      })
      .expect(201);

    const offersRes = await request(app.getHttpServer())
      .get('/drivers/offers/pending')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .expect(200);

    const offerId = offersRes.body[0]?.id;
    expect(offerId).toBeTruthy();

    const actionId = `e2e-action-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const accept1 = await request(app.getHttpServer())
      .post(`/drivers/offers/${offerId}/accept`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ actionId })
      .expect(201);

    const accept2 = await request(app.getHttpServer())
      .post(`/drivers/offers/${offerId}/accept`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ actionId })
      .expect(201);

    expect(accept1.body).toEqual(accept2.body);
    if (accept1.body.request) {
      expect(accept1.body.request.id).toBe(createRes.body.id);
    }

    await prisma.rideRequest.updateMany({ where: { id: createRes.body.id }, data: { status: 'EXPIRED', assignedDriverId: null } });
    await prisma.driverOffer.deleteMany({ where: { requestId: createRes.body.id } });
    await prisma.offerAcceptIdempotency.deleteMany({ where: { offerId } });
    await prisma.driverQueue.updateMany({ where: { routeId: route.id }, data: { status: 'REMOVED_INACTIVE' } });
  });
});
