import { ListEntryType } from '@prisma/client';
export declare class AdminListEntryCreateDto {
    type: ListEntryType;
    value: string;
    reason: string;
}
export declare class AdminListEntryItemDto {
    id: string;
    type: ListEntryType;
    value: string;
    reason?: string | null;
    isActive: boolean;
    createdAt: Date;
}
