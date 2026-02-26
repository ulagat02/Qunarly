import { DisputeResolution } from '@prisma/client';
export declare class AdminOpenDisputeDto {
    reason: string;
}
export declare class AdminResolveDisputeDto {
    resolution: DisputeResolution;
    resolutionNote?: string;
    reason: string;
}
