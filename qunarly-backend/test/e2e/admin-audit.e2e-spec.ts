import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { ensureSuperAdmin, ensureSuperAdminLogin } from './helpers/admin.helper';

describe('Admin audit e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
    await app.close();
  });

  it('GET /admin/audit returns audit rows with actor info', async () => {
    const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);

    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    await prisma.auditLog.create({
      data: {
        userId: admin?.id,
        action: 'admin.test.action',
        metaJson: { reason: 'seed' },
      },
    });

    const res = await request(app.getHttpServer())
      .get('/admin/audit?limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty('action');
    expect(res.body.items[0]).toHaveProperty('actor');
  });

  it('paginates /admin/audit with deterministic cursor', async () => {
    const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const base = new Date();
    const older = new Date(base.getTime() - 10_000);
    const newer = new Date(base.getTime() - 5_000);
    const action = `admin.test.pagination.${Date.now()}`;
    const logA = await prisma.auditLog.create({
      data: { userId: admin?.id, action, metaJson: { a: 1 }, createdAt: older },
    });
    const logB = await prisma.auditLog.create({
      data: { userId: admin?.id, action, metaJson: { b: 2 }, createdAt: newer },
    });

    const page1 = await request(app.getHttpServer())
      .get(`/admin/audit?limit=1&action=${encodeURIComponent(action)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const page2 = await request(app.getHttpServer())
      .get(
        `/admin/audit?limit=1&action=${encodeURIComponent(action)}&cursor=${encodeURIComponent(
          page1.body.nextCursor,
        )}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(page1.body.items[0].id).toBe(logB.id);
    expect(page2.body.items[0].id).toBe(logA.id);
    expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
  });
});
