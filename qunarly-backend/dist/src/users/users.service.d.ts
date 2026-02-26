import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
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
        ratingStats: Prisma.JsonValue | null;
        homeLat: number | null;
        homeLng: number | null;
        homeAddressText: string | null;
        homeRegion: string | null;
        homeUpdatedAt: Date | null;
        settlementId: string | null;
        expoPushToken: string | null;
    })[]>;
    findById(id: string): Promise<({
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
        ratingStats: Prisma.JsonValue | null;
        homeLat: number | null;
        homeLng: number | null;
        homeAddressText: string | null;
        homeRegion: string | null;
        homeUpdatedAt: Date | null;
        settlementId: string | null;
        expoPushToken: string | null;
    }) | null>;
    getPublicProfile(userId: string): Promise<{
        id: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        region: {
            regionId: string | null;
            regionName: string | null;
            districtId: string | null;
            districtName: string | null;
            settlementId: string | null;
            settlementName: string | null;
        };
        ratingStats: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray;
        listings: {
            id: string;
            title: string;
            quantity: number;
            unit: string;
            price: number;
            currency: string;
            coverImageUrl: string;
        }[];
    }>;
}
