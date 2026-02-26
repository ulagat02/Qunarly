import { PrismaService } from '../common/prisma.service';
import { CreateAddressPointDto } from './dto/create-address-point.dto';
export declare class AddressPointsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreateAddressPointDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        lat: number;
        lng: number;
        updatedAt: Date;
        source: string;
        street: string | null;
        houseNumber: string | null;
        locality: string | null;
        confirmCount: number;
    }>;
    search(q: string, lat: number, lng: number, radiusKm: number): Promise<{
        streetCount: number | undefined;
        id: string;
        lat: number;
        lng: number;
        street: string | null;
        houseNumber: string | null;
        locality: string | null;
        confirmCount: number;
    }[]>;
    private findNearby;
}
