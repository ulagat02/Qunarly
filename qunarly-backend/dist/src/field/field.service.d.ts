import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFieldJobDto } from './dto/create-field-job.dto';
export declare class FieldService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    createJob(farmerId: string, dto: CreateFieldJobDto): Promise<{
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
    acceptJob(id: string, executorId: string): Promise<{
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
    startJob(id: string, executorId: string): Promise<{
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
    completeJob(id: string, executorId: string): Promise<{
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
    cancelJob(id: string, userId: string): Promise<{
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
