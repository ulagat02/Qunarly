import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';

describe('Logistics e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
  const shipmentIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (shipmentIds.length) {
      await prisma.shipmentJob.deleteMany({ where: { id: { in: shipmentIds } } });
    }
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.profile.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('GET /logistics/shipments -> 200 for CARRIER', async () => {
    const { accessToken, email } = await registerAndLogin(app, {
      role: UserRole.CARRIER,
    });
    createdEmails.push(email);

    return request(app.getHttpServer())
      .get('/logistics/shipments')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('GET /logistics/shipments without token -> 401', async () => {
    return request(app.getHttpServer())
      .get('/logistics/shipments')
      .expect(401);
  });

  it('POST /logistics/shipments (BUYER) then accept (CARRIER)', async () => {
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    const carrier = await registerAndLogin(app, { role: UserRole.CARRIER });
    createdEmails.push(buyer.email, carrier.email);

    const created = await request(app.getHttpServer())
      .post('/logistics/shipments')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        originLat: 43.25,
        originLng: 76.9,
        destLat: 43.3,
        destLng: 76.95,
        cargoJson: { type: 'grain', weightKg: 100 },
      })
      .expect(201);

    const shipmentId = created.body.id as string;
    shipmentIds.push(shipmentId);

    await request(app.getHttpServer())
      .post(`/logistics/shipments/${shipmentId}/accept`)
      .set('Authorization', `Bearer ${carrier.accessToken}`)
      .expect(201);
  });
});
