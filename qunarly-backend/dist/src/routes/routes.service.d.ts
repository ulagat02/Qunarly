import { PrismaService } from '../common/prisma.service';
import { CreateRouteTemplateDto } from './dto/create-route-template.dto';
export declare class RoutesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateRouteTemplateDto): Promise<({
        fromHub: {
            id: string;
            name: string;
            regionId: string | null;
            createdAt: Date;
            districtId: string | null;
            isActive: boolean;
            lat: number;
            lng: number;
            updatedAt: Date;
            normalizedName: string;
            radiusKm: number;
        };
        toHub: {
            id: string;
            name: string;
            regionId: string | null;
            createdAt: Date;
            districtId: string | null;
            isActive: boolean;
            lat: number;
            lng: number;
            updatedAt: Date;
            normalizedName: string;
            radiusKm: number;
        };
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        isActive: boolean;
        fromHubId: string;
        toHubId: string;
        scheduleType: import(".prisma/client").$Enums.ScheduleType;
        typicalPrice: number | null;
    }) | null>;
    listFromHub(fromHubId: string): Promise<({
        toHub: {
            id: string;
            name: string;
            regionId: string | null;
            createdAt: Date;
            districtId: string | null;
            isActive: boolean;
            lat: number;
            lng: number;
            updatedAt: Date;
            normalizedName: string;
            radiusKm: number;
        };
    } & {
        id: string;
        name: string | null;
        createdAt: Date;
        isActive: boolean;
        fromHubId: string;
        toHubId: string;
        scheduleType: import(".prisma/client").$Enums.ScheduleType;
        typicalPrice: number | null;
    })[]>;
}
