import { RegionsService } from './regions.service';
export declare class VillagesController {
    private regionsService;
    constructor(regionsService: RegionsService);
    listVillages(districtId?: string, q?: string, limit?: string): Promise<{
        id: string;
        name: string;
    }[]>;
}
