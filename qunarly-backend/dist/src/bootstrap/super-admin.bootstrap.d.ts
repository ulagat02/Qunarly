import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
export declare class SuperAdminBootstrap implements OnModuleInit {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
}
