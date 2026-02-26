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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VillagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const villages_service_1 = require("./villages.service");
const create_village_dto_1 = require("./dto/create-village.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const client_1 = require("@prisma/client");
let VillagesController = class VillagesController {
    constructor(villagesService) {
        this.villagesService = villagesService;
    }
    async list(req, bbox, districtId, q) {
        const user = req.user;
        if (bbox) {
            return this.villagesService.listByBounds(bbox);
        }
        if (districtId) {
            return this.villagesService.listByDistrict(districtId, user.id, q);
        }
        return [];
    }
    async nearest(lat, lng, radiusKm) {
        const parsedLat = lat ? Number(lat) : NaN;
        const parsedLng = lng ? Number(lng) : NaN;
        const parsedRadius = radiusKm ? Number(radiusKm) : 15;
        if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
            throw new common_1.BadRequestException('lat/lng required');
        }
        if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
            throw new common_1.BadRequestException('radiusKm is invalid');
        }
        return this.villagesService.findNearest(parsedLat, parsedLng, parsedRadius);
    }
    async get(id) {
        return this.villagesService.getById(id);
    }
    async create(req, dto) {
        const user = req.user;
        return this.villagesService.create(user.id, dto);
    }
    async updateStatus(id, status) {
        return this.villagesService.updateStatus(id, status);
    }
};
exports.VillagesController = VillagesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('bbox')),
    __param(2, (0, common_1.Query)('districtId')),
    __param(3, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], VillagesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('nearest'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radiusKm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], VillagesController.prototype, "nearest", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VillagesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_village_dto_1.CreateVillageDto]),
    __metadata("design:returntype", Promise)
], VillagesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VillagesController.prototype, "updateStatus", null);
exports.VillagesController = VillagesController = __decorate([
    (0, swagger_1.ApiTags)('Community Villages'),
    (0, common_1.Controller)('community-villages'),
    __metadata("design:paramtypes", [villages_service_1.VillagesService])
], VillagesController);
//# sourceMappingURL=villages.controller.js.map