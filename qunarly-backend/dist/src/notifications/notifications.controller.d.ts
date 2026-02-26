import { Request } from 'express';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    listMine(req: Request): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }[]>;
    markRead(req: Request, id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }>;
    updateStatus(req: Request, id: string, body: {
        status?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        type: string;
        body: string;
        dataJson: import("@prisma/client/runtime/library").JsonValue | null;
        isRead: boolean;
    }>;
    updatePushToken(req: Request, body: {
        token?: string;
    }): Promise<{
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
