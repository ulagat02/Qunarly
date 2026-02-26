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
exports.VillagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const normalizeVillageName = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const toRad = (value) => (value * Math.PI) / 180;
const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
};
let VillagesService = class VillagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const nameDisplay = dto.nameDisplay.trim().replace(/\s+/g, ' ');
        const nameNormalized = nameDisplay.toLowerCase();
        if (nameDisplay.length < 2) {
            throw new common_1.BadRequestException('Village name too short');
        }
        const existing = await this.prisma.communityVillage.findFirst({
            where: {
                nameNormalized,
                districtId: dto.districtId,
            },
        });
        if (existing) {
            return existing;
        }
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const createdToday = await this.prisma.communityVillage.count({
            where: {
                createdByUserId: userId,
                createdAt: { gte: startOfDay },
            },
        });
        if (createdToday >= 2) {
            throw new common_1.BadRequestException('Daily village creation limit reached');
        }
        const region = await this.prisma.region.findUnique({ where: { id: dto.regionId } });
        const district = await this.prisma.district.findUnique({ where: { id: dto.districtId } });
        if (!region) {
            throw new common_1.BadRequestException('Region not found');
        }
        if (!district) {
            throw new common_1.BadRequestException('District not found');
        }
        if (district.regionId !== dto.regionId) {
            throw new common_1.BadRequestException('District does not belong to region');
        }
        return this.prisma.communityVillage.create({
            data: {
                nameDisplay,
                nameNormalized,
                regionId: dto.regionId,
                districtId: dto.districtId,
                lat: dto.lat,
                lng: dto.lng,
                createdByUserId: userId,
                status: 'PENDING',
            },
        });
    }
    async listByBounds(bbox) {
        const parts = bbox.split(',').map((value) => Number(value));
        if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
            throw new common_1.BadRequestException('Invalid bbox');
        }
        const [west, south, east, north] = parts;
        return this.prisma.communityVillage.findMany({
            where: {
                lat: { gte: south, lte: north },
                lng: { gte: west, lte: east },
                status: 'ACTIVE',
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findNearest(lat, lng, radiusKm = 15) {
        const deltaLat = radiusKm / 111;
        const deltaLng = radiusKm / (111 * Math.cos(toRad(lat)));
        const candidates = await this.prisma.communityVillage.findMany({
            where: {
                lat: { gte: lat - deltaLat, lte: lat + deltaLat },
                lng: { gte: lng - deltaLng, lte: lng + deltaLng },
                status: 'ACTIVE',
            },
        });
        let nearest = null;
        let nearestDist = Infinity;
        for (const candidate of candidates) {
            const distance = haversineKm({ lat, lng }, { lat: candidate.lat, lng: candidate.lng });
            if (distance <= radiusKm && distance < nearestDist) {
                nearest = candidate;
                nearestDist = distance;
            }
        }
        return nearest ? { ...nearest, distanceKm: nearestDist } : null;
    }
    async listByDistrict(districtId, userId, q) {
        const normalizedQ = q ? q.trim().toLowerCase().replace(/\s+/g, ' ') : undefined;
        return this.prisma.communityVillage.findMany({
            where: {
                districtId,
                ...(normalizedQ ? { nameNormalized: { contains: normalizedQ } } : {}),
                OR: [
                    { status: { in: ['ACTIVE', 'APPROVED'] } },
                    ...(userId ? [{ createdByUserId: userId }] : []),
                ],
            },
            orderBy: { nameDisplay: 'asc' },
        });
    }
    async getById(id) {
        return this.prisma.communityVillage.findUnique({ where: { id } });
    }
    async updateStatus(id, status) {
        return this.prisma.communityVillage.update({
            where: { id },
            data: { status },
        });
    }
};
exports.VillagesService = VillagesService;
exports.VillagesService = VillagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VillagesService);
//# sourceMappingURL=villages.service.js.map