"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.user.findMany({ include: { profile: true } });
    }
    async findById(id) {
        return this.prisma.user.findUnique({ where: { id }, include: { profile: true } });
    }
    async getPublicProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                region: true,
                district: true,
                settlement: true,
                profile: { include: { avatarFile: true } },
            },
        });
        if (!user || !user.publicProfile || user.role !== client_1.UserRole.FARMER) {
            throw new common_1.NotFoundException('Public profile not found');
        }
        const listings = (await this.prisma.productListing.findMany({
            where: { sellerId: userId, status: client_1.ProductListingStatus.PUBLISHED },
            orderBy: { createdAt: client_1.Prisma.SortOrder.desc },
            include: {
                images: {
                    include: { file: true },
                    orderBy: { sortOrder: client_1.Prisma.SortOrder.asc },
                },
            },
        }));
        const displayName = user.displayName ?? user.profile?.name ?? 'Фермер';
        const avatarUrl = user.avatarUrl ?? user.profile?.avatarFile?.url ?? null;
        return {
            id: user.id,
            displayName,
            avatarUrl,
            bio: user.bio ?? null,
            region: {
                regionId: user.regionId ?? null,
                regionName: user.region?.name ?? null,
                districtId: user.districtId ?? null,
                districtName: user.district?.name ?? null,
                settlementId: user.settlementId ?? null,
                settlementName: user.settlement?.nameDisplay ?? null,
            },
            ratingStats: user.ratingStats ?? { rating: 0, reviewsCount: 0 },
            listings: listings.map((listing) => ({
                id: listing.id,
                title: listing.title,
                quantity: listing.quantity,
                unit: listing.unit,
                price: listing.price,
                currency: listing.currency,
                coverImageUrl: listing.images[0]?.file.url ?? null,
            })),
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map