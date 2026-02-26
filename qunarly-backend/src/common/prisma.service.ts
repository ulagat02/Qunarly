import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL || '';
  const limit = process.env.DATABASE_CONNECTION_LIMIT || '80';
  if (!url.includes('connection_limit')) {
    return url + (url.includes('?') ? '&' : '?') + `connection_limit=${limit}`;
  }
  return undefined;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const override = getDatasourceUrl();
    super(override ? { datasources: { db: { url: override } } } : undefined);
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
