import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
export declare class RegionsController {
    private regionsService;
    constructor(regionsService: RegionsService);
    list(): Promise<({
        children: {
            id: string;
            name: string;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        parentId: string | null;
    })[]>;
    listDistricts(regionId?: string): Promise<{
        id: string;
        name: string;
        regionId: string;
        createdAt: Date;
    }[]>;
    create(dto: CreateRegionDto): Promise<{
        id: string;
        name: string;
        parentId: string | null;
    }>;
}
