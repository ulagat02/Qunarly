import { RouteStatus, RouteType } from '@prisma/client';
export declare class AdminRouteUpsertDto {
    fromHubId: string;
    toHubId: string;
    routeType: RouteType;
    label?: string;
    priority?: number;
    status?: RouteStatus;
    reason: string;
}
