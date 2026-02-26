import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { ensureSuperAdmin, ensureSuperAdminLogin } from './helpers/admin.helper';

describe('Admin stats e2e', () => {
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

  it('GET /admin/stats returns KPI fields', async () => {
    const adminToken = await ensureSuperAdminLogin(app, prisma, adminEmail, adminPassword);

    const res = await request(app.getHttpServer())
      .get('/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('ordersToday');
    expect(res.body).toHaveProperty('orders7d');
    expect(res.body).toHaveProperty('activeDeliveries');
    expect(res.body).toHaveProperty('stuckDeliveries');
    expect(res.body).toHaveProperty('commissionToday');
    expect(res.body).toHaveProperty('commission7d');
    expect(Array.isArray(res.body.chart7d)).toBe(true);
    expect(res.body.chart7d.length).toBe(7);
  });
});
