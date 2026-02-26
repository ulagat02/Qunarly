import { DriverType } from '@prisma/client';
export declare class DriverLocationDto {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    driverType?: DriverType;
    homeRegion?: string;
    routeCorridor?: string;
    vehicleType?: string;
    capacityKg?: number;
}
