import { PrismaService } from '../common/prisma.service';
import { CreateVillageDto } from './dto/create-village.dto';
export declare class VillagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateVillageDto): Promise<{
        id: string;
        regionId: string;
        createdAt: Date;
        districtId: string;
        status: import(".prisma/client").$Enums.CommunityVillageStatus;
        lat: number;
        lng: number;
        nameDisplay: string;
        nameNormalized: string;
        createdByUserId: string | null;
    }>;
    listByBounds(bbox: string): Promise<{
        id: string;
        regionId: string;
        createdAt: Date;
        districtId: string;
        status: import(".prisma/client").$Enums.CommunityVillageStatus;
        lat: number;
        lng: number;
        nameDisplay: string;
        nameNormalized: string;
        createdByUserId: string | null;
    }[]>;
    findNearest(lat: number, lng: number, radiusKm?: number): Promise<{
        distanceKm: number;
        id: string;
        regionId: string;
        createdAt: Date;
        districtId: string;
        status: import(".prisma/client").$Enums.CommunityVillageStatus;
        lat: number;
        lng: number;
        nameDisplay: string;
        nameNormalized: string;
        createdByUserId: string | null;
    } | null>;
    listByDistrict(districtId: string, userId?: string, q?: string): Promise<{
        id: string;
        regionId: string;
        createdAt: Date;
        districtId: string;
        status: import(".prisma/client").$Enums.CommunityVillageStatus;
        lat: number;
        lng: number;
        nameDisplay: string;
        nameNormalized: string;
        createdByUserId: string | null;
    }[]>;
    getById(id: string): Promise<{
        id: string;
        regionId: string;
        createdAt: Date;
        districtId: string;
        status: import(".prisma/client").$Enums.CommunityVillageStatus;
        lat: number;
        lng: number;
        nameDisplay: string;
        nameNormalized: string;
        createdByUserId: string | null;
    } | null>;
    updateStatus(id: string, status: 'ACTIVE' | 'PENDING' | 'REJECTED'): Promise<{
        id: string;
        regionId: string;
        createdAt: Date;
        districtId: string;
        status: import(".prisma/client").$Enums.CommunityVillageStatus;
        lat: number;
        lng: number;
        nameDisplay: string;
        nameNormalized: string;
        createdByUserId: string | null;
    }>;
}
