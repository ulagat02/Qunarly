import { Request } from 'express';
import { DeliveryService } from './delivery.service';
import { DriverLocationDto } from './dto/driver-location.dto';
export declare class DriversController {
    private deliveryService;
    constructor(deliveryService: DeliveryService);
    updateLocation(req: Request, dto: DriverLocationDto): Promise<{
        lat: number;
        lng: number;
        driverId: string;
        updatedAt: Date;
        heading: number | null;
        speed: number | null;
    }>;
}
