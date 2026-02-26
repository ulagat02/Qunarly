import { ScheduleType } from '@prisma/client';
export declare class CreateRouteTemplateDto {
    name?: string;
    fromHubId: string;
    toHubId: string;
    scheduleType?: ScheduleType;
    typicalPrice?: number;
    isActive?: boolean;
}
