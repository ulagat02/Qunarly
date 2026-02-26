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
exports.DeliveryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const roles_guard_1 = require("../common/roles.guard");
const delivery_service_1 = require("./delivery.service");
const dto_1 = require("./dto");
let DeliveryController = class DeliveryController {
    constructor(deliveryService) {
        this.deliveryService = deliveryService;
    }
    async listAvailable(regionText) {
        return this.deliveryService.listAvailable(regionText);
    }
    async listMine(req) {
        const userId = req.user?.id;
        return this.deliveryService.listMine(userId);
    }
    async accept(req, id) {
        const userId = req.user?.id;
        return this.deliveryService.acceptLeg(id, userId);
    }
    async reject(req, id) {
        const userId = req.user?.id;
        return this.deliveryService.rejectLeg(id, userId);
    }
    async start(req, id) {
        const userId = req.user?.id;
        return this.deliveryService.startLeg(id, userId);
    }
    async arrive(req, id, dto) {
        const userId = req.user?.id;
        return this.deliveryService.arriveLeg(id, userId, dto);
    }
    async complete(req, id) {
        const userId = req.user?.id;
        return this.deliveryService.completeLeg(id, userId);
    }
    async requeue(id) {
        return this.deliveryService.requeueLeg(id);
    }
    async createHandoffToken(req, id) {
        const userId = req.user?.id;
        return this.deliveryService.createHandoffToken(id, userId);
    }
    async confirmHandoff(req, id, dto) {
        const userId = req.user?.id;
        return this.deliveryService.confirmHandoff(id, userId, dto);
    }
    async receiveHandoff(req, id, dto) {
        const userId = req.user?.id;
        return this.deliveryService.confirmHandoffReceive(id, userId, dto);
    }
    async completeHandoff(req, id, dto) {
        const userId = req.user?.id;
        return this.deliveryService.completeHubHandoff(id, userId, dto);
    }
    async dropPickDrop(req, id, dto) {
        const userId = req.user?.id;
        return this.deliveryService.dropPickDrop(id, userId, dto);
    }
    async dropPickPickup(req, id, dto) {
        const userId = req.user?.id;
        return this.deliveryService.dropPickPickup(id, userId, dto);
    }
    async createProofEvents(req, dto) {
        const userId = req.user?.id;
        return this.deliveryService.createProofEventsBatch(userId, dto);
    }
};
exports.DeliveryController = DeliveryController;
__decorate([
    (0, common_1.Get)('legs/available'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Query)('regionText')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "listAvailable", null);
__decorate([
    (0, common_1.Get)('legs/mine'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "listMine", null);
__decorate([
    (0, common_1.Post)('legs/:id/accept'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('legs/:id/reject'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('legs/:id/start'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('legs/:id/arrive'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ArriveLegDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "arrive", null);
__decorate([
    (0, common_1.Post)('legs/:id/complete'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('legs/:id/requeue'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "requeue", null);
__decorate([
    (0, common_1.Post)('legs/:id/handoff/token'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "createHandoffToken", null);
__decorate([
    (0, common_1.Post)('legs/:id/handoff/confirm'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.HandoffConfirmDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "confirmHandoff", null);
__decorate([
    (0, common_1.Post)('legs/:id/handoff/receive'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.HandoffAckDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "receiveHandoff", null);
__decorate([
    (0, common_1.Post)('legs/:id/handoff/complete'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.HandoffCompleteDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "completeHandoff", null);
__decorate([
    (0, common_1.Post)('legs/:id/drop-pick/drop'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.DropPickDropDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "dropPickDrop", null);
__decorate([
    (0, common_1.Post)('legs/:id/drop-pick/pickup'),
    (0, roles_decorator_1.Roles)('CARRIER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.DropPickPickupDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "dropPickPickup", null);
__decorate([
    (0, common_1.Post)('proof-events/batch'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ProofEventsBatchDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "createProofEvents", null);
exports.DeliveryController = DeliveryController = __decorate([
    (0, swagger_1.ApiTags)('delivery'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('delivery'),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], DeliveryController);
//# sourceMappingURL=delivery.controller.js.map