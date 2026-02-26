import { PrismaService } from '../common/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
export declare class RegionsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    list(): Promise<({
        children: {
            id: string;
            name: string;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        parentId: string | null;
    })[]>;
    listDistricts(regionId: string): Promise<{
        id: string;
        name: string;
        regionId: string;
        createdAt: Date;
    }[]>;
    listSettlements(districtId: string, query?: string, take?: number): Promise<{
        id: string;
        name: string;
    }[]>;
    create(dto: CreateRegionDto): Promise<{
        id: string;
        name: string;
        parentId: string | null;
    }>;
}
