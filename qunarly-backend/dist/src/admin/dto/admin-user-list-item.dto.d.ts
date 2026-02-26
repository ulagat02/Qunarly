import { UserRole, UserStatus } from '@prisma/client';
export declare class AdminUserListItemDto {
    id: string;
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
}
export declare class AdminUserListResponseDto {
    items: AdminUserListItemDto[];
    nextCursor?: string | null;
}
