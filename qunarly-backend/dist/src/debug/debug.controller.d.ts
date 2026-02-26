import { PrismaService } from '../common/prisma.service';
export declare class DebugController {
    private prisma;
    constructor(prisma: PrismaService);
    getEnv(): {
        dbHost: string;
        dbPort: string;
        dbName: string;
        dbSchema: string;
        uploadsDir: string;
        publicBaseUrl: string | null;
    };
    listUsers(): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
    }[]>;
}
