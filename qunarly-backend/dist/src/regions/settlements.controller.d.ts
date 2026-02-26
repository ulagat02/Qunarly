import { RegionsService } from './regions.service';
export declare class SettlementsController {
    private regionsService;
    constructor(regionsService: RegionsService);
    list(districtId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        districtId: string;
        isCenter: boolean;
    }[]>;
}
