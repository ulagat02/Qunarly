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
exports.TripsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const open_trip_dto_1 = require("./dto/open-trip.dto");
const join_trip_dto_1 = require("./dto/join-trip.dto");
const trips_service_1 = require("./trips.service");
let TripsController = class TripsController {
    constructor(tripsService) {
        this.tripsService = tripsService;
    }
    async openTrip(req, dto) {
        const user = req.user;
        return this.tripsService.openTrip(user.id, dto);
    }
    async listOpenTrips(routeId) {
        if (!routeId)
            return [];
        return this.tripsService.listOpenTrips(routeId);
    }
    async joinTrip(id, req, dto) {
        const user = req.user;
        return this.tripsService.joinTrip(id, user.id, dto.seatCount);
    }
    async leaveTrip(id, req) {
        const user = req.user;
        return this.tripsService.leaveTrip(id, user.id);
    }
    async closeIntent(id, req) {
        const user = req.user;
        return this.tripsService.closeIntent(id, user.id);
    }
    async startTrip(id, req) {
        const user = req.user;
        return this.tripsService.startTrip(id, user.id);
    }
    async completeTrip(id, req) {
        const user = req.user;
        return this.tripsService.completeTrip(id, user.id);
    }
    async cancelTrip(id, req) {
        const user = req.user;
        return this.tripsService.cancelTrip(id, user.id);
    }
    async getActive(req) {
        const user = req.user;
        return this.tripsService.getActiveForUser(user.id);
    }
    async getTrip(id) {
        return this.tripsService.getTrip(id);
    }
};
exports.TripsController = TripsController;
__decorate([
    (0, common_1.Post)('trips/open'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, open_trip_dto_1.OpenTripDto]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "openTrip", null);
__decorate([
    (0, common_1.Get)('trips/open'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Query)('routeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "listOpenTrips", null);
__decorate([
    (0, common_1.Post)('trips/:id/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, join_trip_dto_1.JoinTripDto]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "joinTrip", null);
__decorate([
    (0, common_1.Post)('trips/:id/leave'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "leaveTrip", null);
__decorate([
    (0, common_1.Post)('trips/:id/closeIntent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "closeIntent", null);
__decorate([
    (0, common_1.Post)('trips/:id/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "startTrip", null);
__decorate([
    (0, common_1.Post)('trips/:id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "completeTrip", null);
__decorate([
    (0, common_1.Post)('trips/:id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "cancelTrip", null);
__decorate([
    (0, common_1.Get)('me/active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)('trips/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TripsController.prototype, "getTrip", null);
exports.TripsController = TripsController = __decorate([
    (0, swagger_1.ApiTags)('Trips'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [trips_service_1.TripsService])
], TripsController);
//# sourceMappingURL=trips.controller.js.map