import { UserRole } from '@prisma/client';
export declare class RegisterDto {
    email?: string;
    phone?: string;
    password: string;
    role: UserRole;
    homeAddressText: string;
    homeRegion: string;
    homeLat: number;
    homeLng: number;
    maxWeightKg?: number;
    maxVolumeM3?: number;
    vehicleType?: string;
    refrigerated?: boolean;
    livestockAllowed?: boolean;
    closedBody?: boolean;
}
