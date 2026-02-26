import { PresenceService } from './presence.service';
export declare class PresenceController {
    private presenceService;
    constructor(presenceService: PresenceService);
    resolveHub(lat: string, lng: string): Promise<{
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
