import { HubsService } from '../hubs/hubs.service';
export declare class PresenceService {
    private hubsService;
    constructor(hubsService: HubsService);
    resolveHub(lat: number, lng: number): Promise<{
        confidence: string;
        hubId: string;
        hubName: string;
        distanceM: number;
        nearby: {
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
        }[];
    } | {
        confidence: string;
        hubId: null;
        nearby: {
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
        }[];
        hubName?: undefined;
        distanceM?: undefined;
    }>;
}
