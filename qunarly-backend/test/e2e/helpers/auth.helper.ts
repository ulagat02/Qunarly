import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UserRole } from '@prisma/client';

type RegisterLoginOptions = {
  role?: UserRole;
  email?: string;
  password?: string;
};

const randomEmail = () =>
  `e2e+${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

export const registerAndLogin = async (
  app: INestApplication,
  opts: RegisterLoginOptions = {},
) => {
  const email = opts.email ?? randomEmail();
  const password = opts.password ?? 'test1234';
  const role = opts.role ?? UserRole.FARMER;
  const isCarrier = role === UserRole.CARRIER;

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password,
      role,
      homeAddressText: 'E2E Home Address',
      homeRegion: 'E2E Region',
      homeLat: 43.25,
      homeLng: 76.9,
      ...(isCarrier
        ? {
            maxWeightKg: 500,
            maxVolumeM3: 10,
            vehicleType: 'GAZELLE',
          }
        : {}),
    })
    .expect(201);

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: loginResponse.body.accessToken as string,
    email,
    password,
    role,
  };
};
