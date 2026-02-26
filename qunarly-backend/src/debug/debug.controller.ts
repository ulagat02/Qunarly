import { Controller, Get, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import { PrismaService } from '../common/prisma.service';

const getEnvSummary = () => {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  let dbHost = 'unknown';
  let dbPort = 'unknown';
  let dbName = 'unknown';
  let dbSchema = 'public';
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      dbHost = url.hostname || dbHost;
      dbPort = url.port || dbPort;
      dbName = url.pathname.replace(/^\//, '') || dbName;
      dbSchema = url.searchParams.get('schema') || dbSchema;
    } catch {
      // keep defaults
    }
  }
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const publicBaseUrl =
    process.env.APP_BASE_URL || process.env.BASE_URL || process.env.PUBLIC_BASE_URL || null;
  return {
    dbHost,
    dbPort,
    dbName,
    dbSchema,
    uploadsDir,
    publicBaseUrl,
  };
};

@Controller('debug')
export class DebugController {
  constructor(private prisma: PrismaService) {}

  @Get('env')
  getEnv() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return getEnvSummary();
  }

  @Get('users')
  async listUsers() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
