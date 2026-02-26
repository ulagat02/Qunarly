import { Request } from 'express';
import { VillagesService } from './villages.service';
import { CreateVillageDto } from './dto/create-village.dto';
export declare class VillagesController {
    private villagesService;
    constructor(villagesService: VillagesService);
    list(req: Request, bbox?: string, districtId?: string, q?: string): Promise<{
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
    nearest(lat?: string, lng?: string, radiusKm?: string): Promise<{
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
    get(id: string): Promise<{
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
    create(req: Request, dto: CreateVillageDto): Promise<{
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
