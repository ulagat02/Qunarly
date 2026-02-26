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
exports.AddressPointsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const address_points_service_1 = require("./address-points.service");
const create_address_point_dto_1 = require("./dto/create-address-point.dto");
let AddressPointsController = class AddressPointsController {
    constructor(addressPointsService) {
        this.addressPointsService = addressPointsService;
    }
    async create(req, dto) {
        const userId = req.user?.id;
        return this.addressPointsService.create(userId, dto);
    }
    async search(q, lat, lng, radiusKm) {
        const parsedLat = Number(lat);
        const parsedLng = Number(lng);
        const parsedRadius = radiusKm ? Number(radiusKm) : 5;
        return this.addressPointsService.search(q ?? '', parsedLat, parsedLng, parsedRadius);
    }
};
exports.AddressPointsController = AddressPointsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_address_point_dto_1.CreateAddressPointDto]),
    __metadata("design:returntype", Promise)
], AddressPointsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('lat')),
    __param(2, (0, common_1.Query)('lng')),
    __param(3, (0, common_1.Query)('radiusKm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AddressPointsController.prototype, "search", null);
exports.AddressPointsController = AddressPointsController = __decorate([
    (0, swagger_1.ApiTags)('address-points'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('address-points'),
    __metadata("design:paramtypes", [address_points_service_1.AddressPointsService])
], AddressPointsController);
//# sourceMappingURL=address-points.controller.js.map