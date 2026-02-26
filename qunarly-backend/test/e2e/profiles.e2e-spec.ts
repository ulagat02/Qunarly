import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import * as path from 'path';

describe('Profiles e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
  let regionId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    const region = await prisma.region.create({ data: { name: 'Test Region' } });
    regionId = region.id;
  });

  afterAll(async () => {
    await prisma.region.deleteMany({ where: { id: regionId } });
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.file.deleteMany({ where: { ownerId: user.id } });
        await prisma.profile.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('PUT /profiles/me', async () => {
    const { accessToken, email } = await registerAndLogin(app);
    createdEmails.push(email);

    const response = await request(app.getHttpServer())
      .put('/profiles/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Ulagat',
        phone: '77001234567',
        regionId,
        farmName: 'Qunarly Farm',
      })
      .expect(200);

    expect(response.body.firstName).toBe('Ulagat');
    expect(response.body.phone).toBe('77001234567');
    expect(response.body.regionId).toBe(regionId);
    expect(response.body.farmName).toBe('Qunarly Farm');
  });

  it('POST /profiles/me/avatar -> avatarUrl', async () => {
    const { accessToken, email } = await registerAndLogin(app);
    createdEmails.push(email);

    const response = await request(app.getHttpServer())
      .post('/profiles/me/avatar')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', path.join(__dirname, 'fixtures/avatar.png'))
      .expect(201);

    expect(response.body.avatarUrl).toBeTruthy();
  });

  it('GET /profiles/me', async () => {
    const { accessToken, email } = await registerAndLogin(app);
    createdEmails.push(email);

    return request(app.getHttpServer())
      .get('/profiles/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('GET /profiles/me without token -> 401', async () => {
    return request(app.getHttpServer())
      .get('/profiles/me')
      .expect(401);
  });
});
