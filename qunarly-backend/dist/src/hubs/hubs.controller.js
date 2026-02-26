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
exports.HubsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const hubs_service_1 = require("./hubs.service");
const create_hub_dto_1 = require("./dto/create-hub.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let HubsController = class HubsController {
    constructor(hubsService) {
        this.hubsService = hubsService;
    }
    async create(dto) {
        return this.hubsService.create(dto);
    }
    async listNearby(lat, lng, radius) {
        return this.hubsService.listNearby(Number(lat), Number(lng), radius ? Number(radius) : 5000);
    }
    async requestRemoval(req, id) {
        const user = req.user;
        return this.hubsService.requestRemoval(user.id, id);
    }
};
exports.HubsController = HubsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_hub_dto_1.CreateHubDto]),
    __metadata("design:returntype", Promise)
], HubsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HubsController.prototype, "listNearby", null);
__decorate([
    (0, common_1.Post)(':id/request-removal'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HubsController.prototype, "requestRemoval", null);
exports.HubsController = HubsController = __decorate([
    (0, swagger_1.ApiTags)('Hubs'),
    (0, common_1.Controller)('hubs'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [hubs_service_1.HubsService])
], HubsController);
//# sourceMappingURL=hubs.controller.js.map