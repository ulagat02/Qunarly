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
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma.service");
const files_service_1 = require("../files/files.service");
let ProfilesService = class ProfilesService {
    constructor(prisma, filesService) {
        this.prisma = prisma;
        this.filesService = filesService;
    }
    async getByUserId(userId) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: { avatarFile: true },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { region: true, district: true, settlement: true },
        });
        if (!profile && !user) {
            return null;
        }
        const settlementName = user?.settlement?.nameDisplay ?? null;
        const resolvedDisplayName = user?.displayName ?? profile?.name ?? '';
        const resolvedAvatarUrl = user?.avatarUrl ?? profile?.avatarFile?.url ?? null;
        return {
            firstName: profile?.name ?? '',
            displayName: resolvedDisplayName,
            phone: user?.phone ?? null,
            regionId: user?.regionId ?? profile?.regionId ?? null,
            regionName: user?.region?.name ?? null,
            districtId: user?.districtId ?? null,
            districtName: user?.district?.name ?? null,
            settlementId: user?.settlementId ?? null,
            settlementName,
            addressText: user?.homeAddressText ?? null,
            lat: user?.homeLat ?? null,
            lng: user?.homeLng ?? null,
            homeUpdatedAt: user?.homeUpdatedAt ?? null,
            farmName: profile?.farmName ?? null,
            avatarUrl: resolvedAvatarUrl,
            bio: user?.bio ?? null,
            publicProfile: user?.publicProfile ?? true,
            ratingStats: user?.ratingStats ?? null,
        };
    }
    async upsertProfile(userId, dto) {
        const { firstName, name, displayName, bio, publicProfile, phone, avatarFileId, avatarUrl, regionId, districtId, settlementId, addressText, lat, lng, homeAddressText, homeRegion, homeLat, homeLng, ...rest } = dto;
        const resolvedAddressText = addressText ?? homeAddressText;
        const resolvedLat = lat ?? homeLat;
        const resolvedLng = lng ?? homeLng;
        const resolvedName = firstName ?? name;
        if (phone !== undefined || displayName !== undefined || bio !== undefined || publicProfile !== undefined) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(phone !== undefined ? { phone } : {}),
                    ...(displayName !== undefined ? { displayName } : {}),
                    ...(bio !== undefined ? { bio } : {}),
                    ...(publicProfile !== undefined ? { publicProfile } : {}),
                },
            });
        }
        if (regionId || districtId || settlementId) {
            const region = regionId
                ? await this.prisma.region.findUnique({ where: { id: regionId } })
                : null;
            const district = districtId
                ? await this.prisma.district.findUnique({ where: { id: districtId } })
                : null;
            const settlement = settlementId
                ? await this.prisma.communityVillage.findUnique({ where: { id: settlementId } })
                : null;
            if (regionId && !region) {
                throw new common_1.BadRequestException('Region not found');
            }
            if (districtId && !district) {
                throw new common_1.BadRequestException('District not found');
            }
            if (regionId && districtId && district?.regionId !== regionId) {
                throw new common_1.BadRequestException('District does not belong to region');
            }
            if (settlementId && !settlement) {
                throw new common_1.BadRequestException('Settlement not found');
            }
            if (settlementId && districtId && settlement?.districtId !== districtId) {
                throw new common_1.BadRequestException('Settlement does not belong to district');
            }
        }
        if (regionId !== undefined ||
            districtId !== undefined ||
            settlementId !== undefined) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    regionId: regionId ?? undefined,
                    districtId: districtId ?? undefined,
                    settlementId: settlementId ?? undefined,
                },
            });
        }
        if (resolvedAddressText !== undefined ||
            resolvedLat !== undefined ||
            resolvedLng !== undefined ||
            homeRegion !== undefined) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    homeAddressText: resolvedAddressText ?? undefined,
                    homeRegion: homeRegion ?? undefined,
                    homeLat: resolvedLat ?? undefined,
                    homeLng: resolvedLng ?? undefined,
                    homeUpdatedAt: new Date(),
                },
            });
        }
        let resolvedAvatarFileId = avatarFileId;
        if (avatarFileId) {
            const file = await this.prisma.file.findUnique({ where: { id: avatarFileId } });
            if (!file || file.ownerId !== userId) {
                throw new common_1.BadRequestException('Avatar file not found');
            }
        }
        else if (avatarUrl) {
            const created = await this.prisma.file.create({
                data: {
                    ownerId: userId,
                    type: 'image/url',
                    url: avatarUrl,
                    entityType: client_1.FileEntityType.PROFILE_AVATAR,
                    entityId: userId,
                },
            });
            resolvedAvatarFileId = created.id;
        }
        const profile = await this.prisma.profile.upsert({
            where: { userId },
            update: {
                ...rest,
                ...(resolvedName ? { name: resolvedName } : {}),
                ...(resolvedAvatarFileId ? { avatarFileId: resolvedAvatarFileId } : {}),
                ...(regionId ? { regionId } : {}),
            },
            create: {
                userId,
                name: resolvedName || 'Unnamed',
                ...rest,
                ...(resolvedAvatarFileId ? { avatarFileId: resolvedAvatarFileId } : {}),
                ...(regionId ? { regionId } : {}),
            },
        });
        if (resolvedAvatarFileId) {
            await this.prisma.file.update({
                where: { id: resolvedAvatarFileId },
                data: { entityType: client_1.FileEntityType.PROFILE_AVATAR, entityId: userId },
            });
            const file = await this.prisma.file.findUnique({ where: { id: resolvedAvatarFileId } });
            if (file?.url) {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { avatarUrl: file.url },
                });
            }
        }
        const avatarFile = resolvedAvatarFileId
            ? await this.prisma.file.findUnique({ where: { id: resolvedAvatarFileId } })
            : null;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { region: true, district: true, settlement: true },
        });
        const settlementName = user?.settlement?.nameDisplay ?? null;
        const resolvedDisplayName = user?.displayName ?? profile.name ?? '';
        return {
            firstName: profile.name,
            displayName: resolvedDisplayName,
            phone: user?.phone ?? null,
            regionId: user?.regionId ?? profile.regionId ?? null,
            regionName: user?.region?.name ?? null,
            districtId: user?.districtId ?? null,
            districtName: user?.district?.name ?? null,
            settlementId: user?.settlementId ?? null,
            settlementName,
            addressText: user?.homeAddressText ?? null,
            lat: user?.homeLat ?? null,
            lng: user?.homeLng ?? null,
            homeUpdatedAt: user?.homeUpdatedAt ?? null,
            farmName: profile.farmName ?? null,
            avatarUrl: user?.avatarUrl ?? avatarFile?.url ?? null,
            bio: user?.bio ?? null,
            publicProfile: user?.publicProfile ?? true,
            ratingStats: user?.ratingStats ?? null,
        };
    }
    async uploadAvatar(userId, file, baseUrl) {
        const created = await this.filesService.createUploadedFile(userId, file, client_1.FileEntityType.PROFILE_AVATAR, userId, baseUrl);
        await this.prisma.profile.upsert({
            where: { userId },
            update: { avatarFileId: created.id },
            create: { userId, name: 'Unnamed', avatarFileId: created.id },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: created.url },
        });
        return this.getByUserId(userId);
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, files_service_1.FilesService])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map