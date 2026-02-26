import { HubsService } from './hubs.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { Request } from 'express';
export declare class HubsController {
    private hubsService;
    constructor(hubsService: HubsService);
    create(dto: CreateHubDto): Promise<{
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
    }>;
    listNearby(lat: string, lng: string, radius?: string): Promise<{
        distanceM: number;
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
    }[]>;
    requestRemoval(req: Request, id: string): Promise<{
        ok: boolean;
    }>;
}
