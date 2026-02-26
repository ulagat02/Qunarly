import { PrismaService } from '../../../src/common/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { registerAndLogin } from './auth.helper';

export const ensureSuperAdmin = async (
  prisma: PrismaService,
  email: string,
  password: string,
  displayName = 'Бас Әкімші',
) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ role: UserRole.SUPER_ADMIN }, { email }] },
  });
  if (existing) {
    return existing;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      displayName,
      homeAddressText: 'Admin bootstrap',
      homeRegion: 'N/A',
      homeLat: 0,
      homeLng: 0,
      homeUpdatedAt: new Date(),
    },
  });
};

export const ensureSuperAdminLogin = async (
  app: INestApplication,
  prisma: PrismaService,
  email: string,
  password: string,
) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await registerAndLogin(app, { role: UserRole.BUYER, email, password });
  }
  await prisma.user.update({
    where: { email },
    data: { role: UserRole.SUPER_ADMIN, passwordHash },
  });
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return login.body.accessToken as string;
};
