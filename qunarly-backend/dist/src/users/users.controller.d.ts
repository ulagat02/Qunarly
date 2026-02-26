import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    list(): Promise<({
        profile: {
            name: string;
            regionId: string | null;
            userId: string;
            lat: number | null;
            lng: number | null;
            avatarFileId: string | null;
            farmName: string | null;
        } | null;
    } & {
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
    })[]>;
    get(id: string): Promise<({
        profile: {
            name: string;
            regionId: string | null;
            userId: string;
            lat: number | null;
            lng: number | null;
            avatarFileId: string | null;
            farmName: string | null;
        } | null;
    } & {
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
    }) | null>;
}
