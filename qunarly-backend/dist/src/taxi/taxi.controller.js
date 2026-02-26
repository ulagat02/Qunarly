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
exports.TaxiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_ride_request_dto_1 = require("./dto/create-ride-request.dto");
const join_queue_dto_1 = require("./dto/join-queue.dto");
const create_route_dto_1 = require("./dto/create-route.dto");
const ensure_route_dto_1 = require("./dto/ensure-route.dto");
const taxi_service_1 = require("./taxi.service");
let TaxiController = class TaxiController {
    constructor(taxiService) {
        this.taxiService = taxiService;
    }
    async createRequest(req, dto) {
        const user = req.user;
        return this.taxiService.createRequest(user.id, dto);
    }
    async createRoute(dto) {
        return this.taxiService.createRoute(dto);
    }
    async ensureRoute(req, dto) {
        const user = req.user;
        return this.taxiService.ensureRoute(user.id, dto);
    }
    async listRoutes(originVillageId, destVillageId, mode) {
        return this.taxiService.listRoutes(originVillageId, destVillageId, mode ?? 'passenger');
    }
    async getRequest(id) {
        return this.taxiService.getRequest(id);
    }
    async queueDrivers(routeId) {
        if (!routeId) {
            return [];
        }
        return this.taxiService.listQueueDrivers(routeId);
    }
    async joinQueue(req, dto) {
        const user = req.user;
        return this.taxiService.joinQueue(user.id, dto);
    }
    async queuePing(req, routeId) {
        if (!routeId) {
            return null;
        }
        const user = req.user;
        return this.taxiService.pingQueue(user.id, routeId);
    }
    async queueStatus(req, routeId) {
        if (!routeId) {
            return null;
        }
        const user = req.user;
        return this.taxiService.getQueueStatus(user.id, routeId);
    }
    async queuePassengers(req, routeId, expireMinutes) {
        if (!routeId) {
            return [];
        }
        const user = req.user;
        const minutes = expireMinutes ? Number(expireMinutes) : 15;
        return this.taxiService.listQueuePassengers(user.id, routeId, minutes);
    }
    async pendingOffers(req) {
        const user = req.user;
        return this.taxiService.listPendingOffers(user.id);
    }
    async activeDriverRequest(req) {
        const user = req.user;
        return this.taxiService.getActiveDriverRequest(user.id);
    }
    async acceptOffer(req, offerId, body) {
        const user = req.user;
        return this.taxiService.acceptOffer(offerId, user.id, body?.actionId);
    }
    async rejectOffer(req, offerId) {
        const user = req.user;
        return this.taxiService.rejectOffer(offerId, user.id);
    }
    async confirmQueuePassenger(req, requestId) {
        const user = req.user;
        return this.taxiService.confirmQueuePassenger(user.id, requestId);
    }
    async skipQueuePassenger(req, requestId) {
        const user = req.user;
        return this.taxiService.skipQueuePassenger(user.id, requestId);
    }
    async removeQueuePassenger(req, requestId, reason) {
        const user = req.user;
        const resolvedReason = reason ?? 'REMOVED_BY_DRIVER';
        return this.taxiService.removeConfirmedPassenger(user.id, requestId, resolvedReason);
    }
    async queueOnTheWay(req, routeId) {
        if (!routeId) {
            return null;
        }
        const user = req.user;
        return this.taxiService.markQueueOnTheWay(user.id, routeId);
    }
    async queueInactive(req, routeId) {
        if (!routeId) {
            return null;
        }
        const user = req.user;
        return this.taxiService.markQueueInactive(user.id, routeId);
    }
    async onTheWay(req, id) {
        const user = req.user;
        return this.taxiService.markOnTheWay(id, user.id);
    }
    async arrived(req, id) {
        const user = req.user;
        return this.taxiService.markArrived(id, user.id);
    }
    async pickedUpByPassenger(req, id) {
        const user = req.user;
        return this.taxiService.markPickedUpByPassenger(id, user.id);
    }
    async passengerReady(req, id) {
        const user = req.user;
        return this.taxiService.markPassengerReady(id, user.id);
    }
    async complete(req, id) {
        const user = req.user;
        return this.taxiService.completeRequest(id, user.id);
    }
    async pickedUpByDriver(req, id) {
        const user = req.user;
        return this.taxiService.markPickedUpByDriver(id, user.id);
    }
    async cancel(req, id) {
        const user = req.user;
        return this.taxiService.cancelRequest(id, user.id);
    }
};
exports.TaxiController = TaxiController;
__decorate([
    (0, common_1.Post)('taxi/requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ride_request_dto_1.CreateRideRequestDto]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Post)('taxi/routes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_route_dto_1.CreateRouteDto]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "createRoute", null);
__decorate([
    (0, common_1.Post)('taxi/routes/ensure'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ensure_route_dto_1.EnsureRouteDto]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "ensureRoute", null);
__decorate([
    (0, common_1.Get)('taxi/routes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Query)('origin')),
    __param(1, (0, common_1.Query)('dest')),
    __param(2, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "listRoutes", null);
__decorate([
    (0, common_1.Get)('taxi/requests/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "getRequest", null);
__decorate([
    (0, common_1.Get)('taxi/queue/drivers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Query)('routeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "queueDrivers", null);
__decorate([
    (0, common_1.Post)('drivers/queue/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, join_queue_dto_1.JoinQueueDto]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.Post)('drivers/queue/ping'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('routeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "queuePing", null);
__decorate([
    (0, common_1.Get)('drivers/queue/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('routeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "queueStatus", null);
__decorate([
    (0, common_1.Get)('drivers/queue/passengers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('routeId')),
    __param(2, (0, common_1.Query)('expireMinutes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "queuePassengers", null);
__decorate([
    (0, common_1.Get)('drivers/offers/pending'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "pendingOffers", null);
__decorate([
    (0, common_1.Get)('drivers/requests/active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "activeDriverRequest", null);
__decorate([
    (0, common_1.Post)('drivers/offers/:offerId/accept'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('offerId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "acceptOffer", null);
__decorate([
    (0, common_1.Post)('drivers/offers/:offerId/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('offerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "rejectOffer", null);
__decorate([
    (0, common_1.Post)('drivers/queue/passengers/:requestId/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "confirmQueuePassenger", null);
__decorate([
    (0, common_1.Post)('drivers/queue/passengers/:requestId/skip'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "skipQueuePassenger", null);
__decorate([
    (0, common_1.Post)('drivers/queue/passengers/:requestId/remove'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "removeQueuePassenger", null);
__decorate([
    (0, common_1.Post)('drivers/queue/on-the-way'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('routeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "queueOnTheWay", null);
__decorate([
    (0, common_1.Post)('drivers/queue/inactive'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('routeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "queueInactive", null);
__decorate([
    (0, common_1.Post)('taxi/requests/:id/on-the-way'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "onTheWay", null);
__decorate([
    (0, common_1.Post)('taxi/requests/:id/arrived'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "arrived", null);
__decorate([
    (0, common_1.Post)('taxi/requests/:id/picked-up'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "pickedUpByPassenger", null);
__decorate([
    (0, common_1.Post)('taxi/requests/:id/ready'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "passengerReady", null);
__decorate([
    (0, common_1.Post)('taxi/requests/:id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('drivers/requests/:id/picked-up'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "pickedUpByDriver", null);
__decorate([
    (0, common_1.Post)('taxi/requests/:id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TaxiController.prototype, "cancel", null);
exports.TaxiController = TaxiController = __decorate([
    (0, swagger_1.ApiTags)('Taxi'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [taxi_service_1.TaxiService])
], TaxiController);
//# sourceMappingURL=taxi.controller.js.map