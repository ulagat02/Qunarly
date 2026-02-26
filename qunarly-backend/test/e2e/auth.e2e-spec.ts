import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';

describe('Auth e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
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

  it('POST /auth/register -> 201', async () => {
    const email = `e2e+${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    const password = 'test1234';

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, role: 'FARMER' })
      .expect(201);

    createdEmails.push(email);
    expect(response.body.accessToken).toBeTruthy();
  });

  it('POST /auth/login -> 200 returns accessToken', async () => {
    const { email, password, role } = await registerAndLogin(app);
    createdEmails.push(email);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password, role })
      .expect(200);

    expect(response.body.accessToken).toBeTruthy();
  });

  it('GET /profiles/me without token -> 401', async () => {
    return request(app.getHttpServer())
      .get('/profiles/me')
      .expect(401);
  });
});
