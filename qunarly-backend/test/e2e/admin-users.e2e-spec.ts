import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import { UserRole } from '@prisma/client';
import { ensureSuperAdmin, ensureSuperAdminLogin } from './helpers/admin.helper';

describe('Admin users e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];
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
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.notification.deleteMany({ where: { userId: user.id } });
        await prisma.carrierProfile.deleteMany({ where: { userId: user.id } });
        await prisma.profile.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('GET /admin/users and /admin/users/:id return user data', async () => {
    const user = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(user.email);

    const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);

    const listRes = await request(app.getHttpServer())
      .get('/admin/users?limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(listRes.body.items)).toBe(true);
    expect(listRes.body.items.length).toBeGreaterThan(0);

    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    const detailRes = await request(app.getHttpServer())
      .get(`/admin/users/${dbUser?.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(detailRes.body).toHaveProperty('id', dbUser?.id);
    expect(detailRes.body).toHaveProperty('ordersAsBuyer');
    expect(detailRes.body).toHaveProperty('ordersAsSeller');
    expect(detailRes.body).toHaveProperty('activeDeliveriesAsDriver');
  });

  it('paginates /admin/users with deterministic cursor', async () => {
    const marker = `page-users-${Date.now()}`;
    const userA = await registerAndLogin(app, { role: UserRole.BUYER, email: `${marker}-a@example.com` });
    const userB = await registerAndLogin(app, { role: UserRole.BUYER, email: `${marker}-b@example.com` });
    createdEmails.push(userA.email, userB.email);

    const dbUserA = await prisma.user.findUnique({ where: { email: userA.email } });
    const dbUserB = await prisma.user.findUnique({ where: { email: userB.email } });
    const now = new Date();
    await prisma.user.update({ where: { id: dbUserA?.id }, data: { createdAt: new Date(now.getTime() - 10_000) } });
    await prisma.user.update({ where: { id: dbUserB?.id }, data: { createdAt: new Date(now.getTime() - 5_000) } });

    const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);

    const page1 = await request(app.getHttpServer())
      .get(`/admin/users?limit=1&q=${encodeURIComponent(marker)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const page2 = await request(app.getHttpServer())
      .get(
        `/admin/users?limit=1&q=${encodeURIComponent(marker)}&cursor=${encodeURIComponent(
          page1.body.nextCursor,
        )}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(page1.body.items[0].id).toBe(dbUserB?.id);
    expect(page2.body.items[0].id).toBe(dbUserA?.id);
    expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
  });
});
