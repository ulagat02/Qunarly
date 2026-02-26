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
var RegionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let RegionsService = RegionsService_1 = class RegionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RegionsService_1.name);
    }
    async list() {
        return this.prisma.region.findMany({
            where: { parentId: null },
            include: { children: true },
            orderBy: { name: 'asc' },
        });
    }
    async listDistricts(regionId) {
        const districts = await this.prisma.district.findMany({
            where: { regionId },
            orderBy: { name: 'asc' },
        });
        this.logger.log(`listDistricts: regionId=${regionId} count=${districts.length}`);
        return districts;
    }
    async listSettlements(districtId, query, take = 50) {
        return this.prisma.settlement.findMany({
            where: {
                districtId,
                ...(query
                    ? {
                        name: {
                            contains: query.trim(),
                            mode: 'insensitive',
                        },
                    }
                    : {}),
            },
            orderBy: { name: 'asc' },
            take,
            select: { id: true, name: true },
        });
    }
    async create(dto) {
        return this.prisma.region.create({ data: dto });
    }
};
exports.RegionsService = RegionsService;
exports.RegionsService = RegionsService = RegionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RegionsService);
//# sourceMappingURL=regions.service.js.map