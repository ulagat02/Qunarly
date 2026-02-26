import { UserRole, UserStatus } from '@prisma/client';
export declare class AdminUserDetailDto {
    id: string;
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    lastLoginAt?: Date | null;
    ordersAsBuyer: number;
    ordersAsSeller: number;
    activeDeliveriesAsDriver: number;
    completedLegsAsDriver: number;
}
