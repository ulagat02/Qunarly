import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class SuperAdminBootstrap implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminBootstrap.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const email = process.env.SUPER_ADMIN_EMAIL?.trim();
    const password = process.env.SUPER_ADMIN_PASSWORD?.trim();
    const name = process.env.SUPER_ADMIN_NAME?.trim();
    if (!email || !password) {
      this.logger.warn('SUPER_ADMIN_EMAIL/PASSWORD not set; skipping bootstrap');
      return;
    }

    const existing = await this.prisma.user.findFirst({
      where: { email },
    });
    const passwordHash = await bcrypt.hash(password, 10);
    if (existing) {
      if (existing.role === UserRole.SUPER_ADMIN) {
        this.logger.log('Super admin already exists; skipping');
        return;
      }
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          role: UserRole.SUPER_ADMIN,
          passwordHash,
          displayName: name ?? existing.displayName ?? 'Бас Әкімші',
          homeAddressText: existing.homeAddressText ?? 'Admin bootstrap',
          homeRegion: existing.homeRegion ?? 'N/A',
          homeLat: existing.homeLat ?? 0,
          homeLng: existing.homeLng ?? 0,
          homeUpdatedAt: new Date(),
        },
      });
      this.logger.log('Super admin updated for existing user');
      return;
    }

    await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        displayName: name ?? 'Бас Әкімші',
        homeAddressText: 'Admin bootstrap',
        homeRegion: 'N/A',
        homeLat: 0,
        homeLng: 0,
        homeUpdatedAt: new Date(),
      },
    });
    this.logger.log('Super admin created');
  }
}
