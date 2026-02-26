import { PrismaService } from '../common/prisma.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare const haversineDistanceM: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
export declare class HubsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
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
    listNearby(lat: number, lng: number, radiusMeters?: number): Promise<{
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
    findNearest(lat: number, lng: number): Promise<{
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
    }>;
    getById(id: string): Promise<{
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
    } | null>;
    requestRemoval(userId: string, hubId: string): Promise<{
        ok: boolean;
    }>;
    private normalizeName;
}
