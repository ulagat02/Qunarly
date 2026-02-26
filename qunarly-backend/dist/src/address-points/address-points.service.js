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
exports.AddressPointsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
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
let AddressPointsService = class AddressPointsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, dto) {
        const nearby = await this.findNearby(dto.lat, dto.lng, 0.03);
        const match = nearby.find((item) => {
            const streetMatches = dto.street && item.street?.toLowerCase() === dto.street.toLowerCase();
            const houseMatches = dto.houseNumber && item.houseNumber === dto.houseNumber;
            return Boolean(streetMatches || houseMatches);
        });
        if (match) {
            return this.prisma.addressPoint.update({
                where: { id: match.id },
                data: { confirmCount: { increment: 1 } },
            });
        }
        return this.prisma.addressPoint.create({
            data: {
                userId,
                lat: dto.lat,
                lng: dto.lng,
                street: dto.street,
                houseNumber: dto.houseNumber,
                locality: dto.locality,
                source: 'user_contributed',
            },
        });
    }
    async search(q, lat, lng, radiusKm) {
        const normalized = q.trim().toLowerCase();
        const items = await this.findNearby(lat, lng, radiusKm);
        const filtered = normalized
            ? items.filter((item) => {
                const hay = `${item.street ?? ''} ${item.houseNumber ?? ''} ${item.locality ?? ''}`.toLowerCase();
                return hay.includes(normalized);
            })
            : items;
        const streetCounts = filtered.reduce((acc, item) => {
            const key = (item.street ?? item.locality ?? '').toLowerCase();
            if (!key)
                return acc;
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        }, {});
        return filtered.map((item) => ({
            ...item,
            streetCount: item.street ? streetCounts[item.street.toLowerCase()] ?? 1 : undefined,
        }));
    }
    async findNearby(lat, lng, radiusKm) {
        const delta = radiusKm / 111;
        const candidates = await this.prisma.addressPoint.findMany({
            where: {
                lat: { gte: lat - delta, lte: lat + delta },
                lng: { gte: lng - delta, lte: lng + delta },
            },
            orderBy: { confirmCount: 'desc' },
            take: 50,
        });
        return candidates.filter((item) => haversineKm({ lat, lng }, { lat: item.lat, lng: item.lng }) <= radiusKm);
    }
};
exports.AddressPointsService = AddressPointsService;
exports.AddressPointsService = AddressPointsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressPointsService);
//# sourceMappingURL=address-points.service.js.map