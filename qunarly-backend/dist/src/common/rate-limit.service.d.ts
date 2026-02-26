import { PrismaService } from './prisma.service';
export declare class RateLimitService {
    private prisma;
    private store;
    constructor(prisma: PrismaService);
    check(key: string, identity: string): Promise<void>;
}
