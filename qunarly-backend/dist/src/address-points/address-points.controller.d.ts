import { Request } from 'express';
import { AddressPointsService } from './address-points.service';
import { CreateAddressPointDto } from './dto/create-address-point.dto';
export declare class AddressPointsController {
    private addressPointsService;
    constructor(addressPointsService: AddressPointsService);
    create(req: Request, dto: CreateAddressPointDto): Promise<{
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
    search(q: string, lat: string, lng: string, radiusKm?: string): Promise<{
        streetCount: number | undefined;
        id: string;
        lat: number;
        lng: number;
        street: string | null;
        houseNumber: string | null;
        locality: string | null;
        confirmCount: number;
    }[]>;
}
