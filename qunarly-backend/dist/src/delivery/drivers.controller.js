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
exports.DriversController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const delivery_service_1 = require("./delivery.service");
const driver_location_dto_1 = require("./dto/driver-location.dto");
let DriversController = class DriversController {
    constructor(deliveryService) {
        this.deliveryService = deliveryService;
    }
    async updateLocation(req, dto) {
        const userId = req.user?.id;
        return this.deliveryService.updateDriverLocation(userId, dto);
    }
};
exports.DriversController = DriversController;
__decorate([
    (0, common_1.Post)('location'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, driver_location_dto_1.DriverLocationDto]),
    __metadata("design:returntype", Promise)
], DriversController.prototype, "updateLocation", null);
exports.DriversController = DriversController = __decorate([
    (0, swagger_1.ApiTags)('drivers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('drivers'),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], DriversController);
//# sourceMappingURL=drivers.controller.js.map