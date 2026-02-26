import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';

describe('Field e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let serviceTypeId: string;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const serviceType = await prisma.serviceType.create({
      data: { name: 'Plowing', baseRate: 100 },
    });
    serviceTypeId = serviceType.id;
  });

  afterAll(async () => {
    await prisma.fieldJob.deleteMany({ where: { serviceTypeId } });
    await prisma.serviceType.deleteMany({ where: { id: serviceTypeId } });
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

  it('POST /field/jobs -> 201 for FARMER', async () => {
    const { accessToken, email } = await registerAndLogin(app, {
      role: UserRole.FARMER,
    });
    createdEmails.push(email);

    return request(app.getHttpServer())
      .post('/field/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceTypeId,
        areaHa: 2,
        lat: 43.25,
        lng: 76.9,
      })
      .expect(201);
  });

  it('POST /field/jobs without token -> 401', async () => {
    return request(app.getHttpServer())
      .post('/field/jobs')
      .send({
        serviceTypeId,
        areaHa: 2,
        lat: 43.25,
        lng: 76.9,
      })
      .expect(401);
  });

  it('POST /field/jobs as EXECUTOR -> 403', async () => {
    const { accessToken, email } = await registerAndLogin(app, {
      role: UserRole.EXECUTOR,
    });
    createdEmails.push(email);

    return request(app.getHttpServer())
      .post('/field/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        serviceTypeId,
        areaHa: 2,
        lat: 43.25,
        lng: 76.9,
      })
      .expect(403);
  });

  it('GET /field/jobs -> 200', async () => {
    return request(app.getHttpServer())
      .get('/field/jobs')
      .expect(200);
  });
});
