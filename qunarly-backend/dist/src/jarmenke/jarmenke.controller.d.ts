import { JarmenkeService } from './jarmenke.service';
import { CreateJarmenkeEventDto } from './dto/create-event.dto';
export declare class JarmenkeController {
    private jarmenkeService;
    constructor(jarmenkeService: JarmenkeService);
    createEvent(dto: CreateJarmenkeEventDto): Promise<{
        id: string;
        createdAt: Date;
        productRateOverridePercent: number | null;
        deliveryRateOverridePercent: number | null;
        startAt: Date;
        endAt: Date;
    }>;
    analytics(from?: string, to?: string): Promise<{
        turnover: number;
        commissionRevenue: number;
        activeSellers: number;
        activeDrivers: number;
        from: Date;
        to: Date;
    }>;
}
