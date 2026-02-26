import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(userId: string | null, action: string, metaJson?: Prisma.InputJsonValue): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        metaJson: Prisma.JsonValue | null;
        action: string;
    }>;
}
