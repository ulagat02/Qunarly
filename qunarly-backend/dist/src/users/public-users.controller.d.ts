import { UsersService } from './users.service';
export declare class PublicUsersController {
    private usersService;
    constructor(usersService: UsersService);
    getPublicProfile(id: string): Promise<{
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
        ratingStats: string | number | boolean | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
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
