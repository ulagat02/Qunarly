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
var LogisticsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logistics_service_1 = require("./logistics.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const client_1 = require("@prisma/client");
const create_shipment_dto_1 = require("./dto/create-shipment.dto");
let LogisticsController = LogisticsController_1 = class LogisticsController {
    constructor(logisticsService) {
        this.logisticsService = logisticsService;
        this.logger = new common_1.Logger(LogisticsController_1.name);
    }
    async createShipment(req, dto) {
        const user = req.user;
        this.logger.log(`createShipment body=${JSON.stringify(req.body)}`);
        this.logger.log(`createShipment dto=${JSON.stringify(dto)}`);
        try {
            return await this.logisticsService.createShipment(user.id, dto);
        }
        catch (error) {
            this.logger.error('createShipment failed', error instanceof Error ? error.stack : `${error}`);
            throw error;
        }
    }
    async listShipments() {
        return this.logisticsService.listShipments();
    }
    async recommendCarriers(req, id) {
        const user = req.user;
        return this.logisticsService.recommendCarriers(id, user.id);
    }
    async assignCarrier(req, id, body) {
        const user = req.user;
        return this.logisticsService.assignCarrier(id, user.id, body.carrierId);
    }
    async getShipment(id) {
        return this.logisticsService.getShipment(id);
    }
    async acceptShipment(id, req) {
        const user = req.user;
        return this.logisticsService.acceptShipment(id, user.id);
    }
    async pickupStart(id, req) {
        const user = req.user;
        return this.logisticsService.pickupStart(id, user.id);
    }
    async inTransit(id, req) {
        const user = req.user;
        return this.logisticsService.inTransit(id, user.id);
    }
    async deliver(id, req) {
        const user = req.user;
        return this.logisticsService.deliver(id, user.id);
    }
    async cancel(id, req) {
        const user = req.user;
        return this.logisticsService.cancel(id, user.id);
    }
};
exports.LogisticsController = LogisticsController;
__decorate([
    (0, common_1.Post)('shipments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.FARMER, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_shipment_dto_1.CreateShipmentDto]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "createShipment", null);
__decorate([
    (0, common_1.Get)('shipments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "listShipments", null);
__decorate([
    (0, common_1.Get)('shipments/:id/recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.FARMER, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "recommendCarriers", null);
__decorate([
    (0, common_1.Post)('shipments/:id/assign'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.FARMER, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "assignCarrier", null);
__decorate([
    (0, common_1.Get)('shipments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "getShipment", null);
__decorate([
    (0, common_1.Post)('shipments/:id/accept'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CARRIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "acceptShipment", null);
__decorate([
    (0, common_1.Post)('shipments/:id/pickup-start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CARRIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "pickupStart", null);
__decorate([
    (0, common_1.Post)('shipments/:id/in-transit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CARRIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "inTransit", null);
__decorate([
    (0, common_1.Post)('shipments/:id/deliver'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.CARRIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "deliver", null);
__decorate([
    (0, common_1.Post)('shipments/:id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "cancel", null);
exports.LogisticsController = LogisticsController = LogisticsController_1 = __decorate([
    (0, common_1.Controller)('logistics'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [logistics_service_1.LogisticsService])
], LogisticsController);
//# sourceMappingURL=logistics.controller.js.map