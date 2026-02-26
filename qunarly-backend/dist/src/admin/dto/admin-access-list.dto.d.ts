import { AccessListTarget, AccessListType } from '@prisma/client';
export declare class AdminAccessListDto {
    listType: AccessListType;
    targetType: AccessListTarget;
    targetValue: string;
    reason: string;
}
