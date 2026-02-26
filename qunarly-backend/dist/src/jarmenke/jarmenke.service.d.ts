import { PrismaService } from '../common/prisma.service';
export declare class JarmenkeService {
    private prisma;
    constructor(prisma: PrismaService);
    createEvent(dto: {
        startAt: string;
        endAt: string;
        productRateOverridePercent?: number;
        deliveryRateOverridePercent?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        productRateOverridePercent: number | null;
        deliveryRateOverridePercent: number | null;
        startAt: Date;
        endAt: Date;
    }>;
    getAnalytics(from?: string, to?: string): Promise<{
        turnover: number;
        commissionRevenue: number;
        activeSellers: number;
        activeDrivers: number;
        from: Date;
        to: Date;
    }>;
}
