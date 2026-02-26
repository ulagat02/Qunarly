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
exports.HubsService = exports.haversineDistanceM = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const toRad = (value) => (value * Math.PI) / 180;
const haversineDistanceM = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.haversineDistanceM = haversineDistanceM;
let HubsService = class HubsService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(dto) {
        const nearby = await this.listNearby(dto.lat, dto.lng, 5000);
        if (nearby.length > 0) {
            throw new common_1.BadRequestException('Бұл радиуста хаб бар (5км)');
        }
        return this.prisma.hub.create({
            data: {
                name: dto.name.trim(),
                normalizedName: this.normalizeName(dto.name),
                lat: dto.lat,
                lng: dto.lng,
                radiusKm: dto.radiusKm ?? 0.8,
                isActive: dto.isActive ?? true,
                regionId: dto.regionId ?? null,
                districtId: dto.districtId ?? null,
            },
        });
    }
    async listNearby(lat, lng, radiusMeters = 5000) {
        const deltaLat = radiusMeters / 111000;
        const deltaLng = radiusMeters / (111000 * Math.cos(toRad(lat)));
        const candidates = await this.prisma.hub.findMany({
            where: {
                lat: { gte: lat - deltaLat, lte: lat + deltaLat },
                lng: { gte: lng - deltaLng, lte: lng + deltaLng },
                isActive: true,
            },
        });
        return candidates
            .map((hub) => ({
            ...hub,
            distanceM: (0, exports.haversineDistanceM)(lat, lng, hub.lat, hub.lng),
        }))
            .filter((hub) => hub.distanceM <= radiusMeters)
            .sort((a, b) => a.distanceM - b.distanceM);
    }
    async findNearest(lat, lng) {
        const nearby = await this.listNearby(lat, lng, 20000);
        return nearby[0] || null;
    }
    async getById(id) {
        return this.prisma.hub.findUnique({ where: { id } });
    }
    async requestRemoval(userId, hubId) {
        const hub = await this.prisma.hub.findUnique({ where: { id: hubId } });
        if (!hub) {
            throw new common_1.NotFoundException('Hub not found');
        }
        const admins = await this.prisma.user.findMany({
            where: { role: 'ADMIN', status: 'ACTIVE' },
            select: { id: true },
        });
        await this.notificationsService.createForUsers(admins.map((user) => user.id), {
            type: 'HUB_REMOVAL_REQUEST',
            title: 'Хабты жою сұранысы',
            body: `${hub.name} хабын жою туралы сұраныс түсті.`,
            dataJson: { hubId: hub.id, hubName: hub.name, requesterId: userId },
        });
        return { ok: true };
    }
    normalizeName(name) {
        return name.trim().toLowerCase().replace(/\s+/g, ' ');
    }
};
exports.HubsService = HubsService;
exports.HubsService = HubsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], HubsService);
//# sourceMappingURL=hubs.service.js.map