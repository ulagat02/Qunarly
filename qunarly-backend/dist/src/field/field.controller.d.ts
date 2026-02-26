import { FieldService } from './field.service';
import { CreateFieldJobDto } from './dto/create-field-job.dto';
import { Request } from 'express';
export declare class FieldController {
    private fieldService;
    private readonly logger;
    constructor(fieldService: FieldService);
    createJob(req: Request, dto: CreateFieldJobDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.FieldJobStatus;
        lat: number;
        lng: number;
        acceptedBy: string | null;
        cargoWeightKg: number | null;
        cargoVolumeM3: number | null;
        cargoType: string | null;
        pickupAddressText: string | null;
        pickupRegion: string | null;
        notes: string | null;
        areaHa: number;
        priceEstimate: number;
        farmerId: string;
        serviceTypeId: string;
    }>;
    listJobs(): Promise<({
        serviceType: {
            id: string;
            name: string;
            baseRate: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.FieldJobStatus;
        lat: number;
        lng: number;
        acceptedBy: string | null;
        cargoWeightKg: number | null;
        cargoVolumeM3: number | null;
        cargoType: string | null;
        pickupAddressText: string | null;
        pickupRegion: string | null;
        notes: string | null;
        areaHa: number;
        priceEstimate: number;
        farmerId: string;
        serviceTypeId: string;
    })[]>;
    getJob(id: string): Promise<{
        serviceType: {
            id: string;
            name: string;
            baseRate: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.FieldJobStatus;
        lat: number;
        lng: number;
        acceptedBy: string | null;
        cargoWeightKg: number | null;
        cargoVolumeM3: number | null;
        cargoType: string | null;
        pickupAddressText: string | null;
        pickupRegion: string | null;
        notes: string | null;
        areaHa: number;
        priceEstimate: number;
        farmerId: string;
        serviceTypeId: string;
    }>;
    acceptJob(id: string, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.FieldJobStatus;
        lat: number;
        lng: number;
        acceptedBy: string | null;
        cargoWeightKg: number | null;
        cargoVolumeM3: number | null;
        cargoType: string | null;
        pickupAddressText: string | null;
        pickupRegion: string | null;
        notes: string | null;
        areaHa: number;
        priceEstimate: number;
        farmerId: string;
        serviceTypeId: string;
    }>;
    startJob(id: string, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.FieldJobStatus;
        lat: number;
        lng: number;
        acceptedBy: string | null;
        cargoWeightKg: number | null;
        cargoVolumeM3: number | null;
        cargoType: string | null;
        pickupAddressText: string | null;
        pickupRegion: string | null;
        notes: string | null;
        areaHa: number;
        priceEstimate: number;
        farmerId: string;
        serviceTypeId: string;
    }>;
    completeJob(id: string, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.FieldJobStatus;
        lat: number;
        lng: number;
        acceptedBy: string | null;
        cargoWeightKg: number | null;
        cargoVolumeM3: number | null;
        cargoType: string | null;
        pickupAddressText: string | null;
        pickupRegion: string | null;
        notes: string | null;
        areaHa: number;
        priceEstimate: number;
        farmerId: string;
        serviceTypeId: string;
    }>;
    cancelJob(id: string, req: Request): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.FieldJobStatus;
        lat: number;
        lng: number;
        acceptedBy: string | null;
        cargoWeightKg: number | null;
        cargoVolumeM3: number | null;
        cargoType: string | null;
        pickupAddressText: string | null;
        pickupRegion: string | null;
        notes: string | null;
        areaHa: number;
        priceEstimate: number;
        farmerId: string;
        serviceTypeId: string;
    }>;
}
