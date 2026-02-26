import { DeliveryService } from './delivery.service';
export declare class DeliveriesController {
    private deliveryService;
    constructor(deliveryService: DeliveryService);
    listDrivers(id: string, type?: string): Promise<{
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
        driverType: import(".prisma/client").$Enums.DriverType;
        lat: number | undefined;
        lng: number | undefined;
        heading: number | null | undefined;
        speed: number | null | undefined;
        updatedAt: Date | undefined;
    }[]>;
}
