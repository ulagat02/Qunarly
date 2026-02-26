import { RegionsService } from './regions.service';
export declare class DistrictsController {
    private regionsService;
    private readonly logger;
    constructor(regionsService: RegionsService);
    list(regionId?: string): Promise<{
        id: string;
        name: string;
        regionId: string;
        createdAt: Date;
    }[]>;
}
