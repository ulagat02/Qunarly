import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string | null, action: string, metaJson?: Prisma.InputJsonValue) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        metaJson: metaJson ?? undefined,
      },
    });
  }
}
