import { RouteType } from '@prisma/client';
export declare class InfraRouteCreateDto {
    originHubId: string;
    destHubId: string;
    routeType: RouteType;
    priority?: number;
    isActive?: boolean;
    reason: string;
}
