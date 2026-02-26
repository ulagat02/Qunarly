import { PrismaService } from '../common/prisma.service';
export declare class NotificationsService {
    private prisma;
    private expo;
    constructor(prisma: PrismaService);
    listForUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }[]>;
    markRead(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }>;
    updateStatus(userId: string, id: string, status?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }>;
    createForUsers(userIds: string[], payload: {
        type: string;
        title: string;
        body: string;
        dataJson?: any;
    }): Promise<never[]>;
    sendPushToUsers(userIds: string[], payload: {
        title: string;
        body: string;
        data?: Record<string, any>;
    }): Promise<void>;
    private sendPushToTokens;
    updatePushToken(userId: string, token?: string | null): Promise<{
        id: string;
        regionId: string | null;
        createdAt: Date;
        districtId: string | null;
        email: string | null;
        phone: string | null;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        bio: string | null;
        displayName: string | null;
        publicProfile: boolean;
        ratingStats: import("@prisma/client/runtime/library").JsonValue | null;
        homeLat: number | null;
        homeLng: number | null;
        homeAddressText: string | null;
        homeRegion: string | null;
        homeUpdatedAt: Date | null;
        settlementId: string | null;
        expoPushToken: string | null;
    }>;
}
