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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const super_admin_guard_1 = require("../common/guards/super-admin.guard");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async listOrders(query) {
        return this.adminService.listOrders(query);
    }
    async getOrder(id) {
        return this.adminService.getOrder(id);
    }
    async listStuck() {
        return this.adminService.listStuck();
    }
    async listDisputes(query) {
        return this.adminService.listDisputes(query);
    }
    async getDispute(id) {
        return this.adminService.getDisputeDetail(id);
    }
    async getStats() {
        return this.adminService.getStats();
    }
    async listAudit(query) {
        return this.adminService.listAudit(query);
    }
    async listUsers(query) {
        return this.adminService.listUsers(query);
    }
    async getUser(id) {
        return this.adminService.getUserDetail(id);
    }
    async listAlerts() {
        return this.adminService.listAlerts();
    }
    async listPlaybooks() {
        return this.adminService.listPlaybooks();
    }
    async listSlas() {
        return this.adminService.listSlas();
    }
    async listHubs(query) {
        return this.adminService.listHubs();
    }
    async listRoutes(query) {
        return this.adminService.listRoutes();
    }
    async listCommissionConfig() {
        return this.adminService.listCommissionConfig();
    }
    async listCommissionLedger(query) {
        return this.adminService.listCommissionLedger();
    }
    async listCommissionAnomalies(query) {
        return this.adminService.listCommissionAnomalies();
    }
    async listJarmenkeEvents() {
        return this.adminService.listJarmenkeEvents();
    }
    async listAccessList(query) {
        return this.adminService.listAccessList();
    }
    async listFraudSignals(query) {
        return this.adminService.listFraudSignals();
    }
    async listRateLimits() {
        return this.adminService.listRateLimits();
    }
    async infraHealth() {
        return this.adminService.getInfraHealth();
    }
    async infraOrphans() {
        return this.adminService.getInfraOrphans();
    }
    async exportStats(res, format) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="stats.csv"');
        res.send('date,orders,deliveries,stuck\n');
    }
    async exportCommission(res, query) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="commission.csv"');
        res.send('orderId,amount,createdAt\n');
    }
    async cancelOrder(req, id, body) {
        const userId = req.user?.id;
        return this.adminService.cancelOrder(id, userId, body.reason ?? '');
    }
    async forceOrderStatus(req, id, body) {
        return { ok: true };
    }
    async openDispute(req, id, body) {
        return { ok: true };
    }
    async resolveDispute(req, id, body) {
        return { ok: true };
    }
    async flagRefund(req, id, body) {
        return { ok: true };
    }
    async reassignLeg(req, id, body) {
        const userId = req.user?.id;
        return this.adminService.reassignLeg(id, userId, body.driverId ?? '', body.reason ?? '');
    }
    async unlockMainline(req, id, body) {
        const userId = req.user?.id;
        return this.adminService.unlockMainline(id, userId, body.reason ?? '');
    }
    async forceCompleteLeg(req, id, body) {
        return { ok: true };
    }
    async attachLegProof(req, id, body) {
        return { ok: true };
    }
    async adjustLegGeo(req, id, body) {
        return { ok: true };
    }
    async createSla(req, body) {
        return { ok: true };
    }
    async updateSla(req, id, body) {
        return { ok: true };
    }
    async createAlert(req, body) {
        return { ok: true };
    }
    async updateAlert(req, id, body) {
        return { ok: true };
    }
    async createPlaybook(req, body) {
        return { ok: true };
    }
    async updatePlaybook(req, id, body) {
        return { ok: true };
    }
    async createHub(req, body) {
        return { ok: true };
    }
    async createRoute(req, body) {
        return { ok: true };
    }
    async createCommissionConfig(req, body) {
        return { ok: true };
    }
    async createJarmenkeEvent(req, body) {
        return { ok: true };
    }
    async createAccessList(req, body) {
        return { ok: true };
    }
    async removeAccessList(req, id, body) {
        return { ok: true };
    }
    async createRateLimit(req, body) {
        return { ok: true };
    }
    async resolveFraudSignal(req, id, body) {
        return { ok: true };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)(['delivery/stuck', 'stuck']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listStuck", null);
__decorate([
    (0, common_1.Get)('disputes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listDisputes", null);
__decorate([
    (0, common_1.Get)('disputes/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDispute", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('audit'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAudit", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAlerts", null);
__decorate([
    (0, common_1.Get)('playbooks'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listPlaybooks", null);
__decorate([
    (0, common_1.Get)('slas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listSlas", null);
__decorate([
    (0, common_1.Get)('hubs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listHubs", null);
__decorate([
    (0, common_1.Get)('routes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listRoutes", null);
__decorate([
    (0, common_1.Get)('commission/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listCommissionConfig", null);
__decorate([
    (0, common_1.Get)('commission/ledger'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listCommissionLedger", null);
__decorate([
    (0, common_1.Get)('commission/anomalies'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listCommissionAnomalies", null);
__decorate([
    (0, common_1.Get)('jarmenke/events'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listJarmenkeEvents", null);
__decorate([
    (0, common_1.Get)('access-list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listAccessList", null);
__decorate([
    (0, common_1.Get)('fraud/signals'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listFraudSignals", null);
__decorate([
    (0, common_1.Get)('rate-limits'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listRateLimits", null);
__decorate([
    (0, common_1.Get)('infra/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "infraHealth", null);
__decorate([
    (0, common_1.Get)('infra/orphans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "infraOrphans", null);
__decorate([
    (0, common_1.Get)('exports/stats'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportStats", null);
__decorate([
    (0, common_1.Get)('exports/commission'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportCommission", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/force-status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forceOrderStatus", null);
__decorate([
    (0, common_1.Post)('orders/:id/dispute'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "openDispute", null);
__decorate([
    (0, common_1.Post)('orders/:id/dispute/resolve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Post)('orders/:id/refund-flag'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "flagRefund", null);
__decorate([
    (0, common_1.Post)('delivery/legs/:id/reassign'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reassignLeg", null);
__decorate([
    (0, common_1.Post)('delivery/legs/:id/unlock-mainline'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unlockMainline", null);
__decorate([
    (0, common_1.Post)('delivery/legs/:id/force-complete'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forceCompleteLeg", null);
__decorate([
    (0, common_1.Post)('delivery/legs/:id/proof'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "attachLegProof", null);
__decorate([
    (0, common_1.Post)('delivery/legs/:id/adjust-geo'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adjustLegGeo", null);
__decorate([
    (0, common_1.Post)('slas'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSla", null);
__decorate([
    (0, common_1.Post)('slas/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSla", null);
__decorate([
    (0, common_1.Post)('alerts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAlert", null);
__decorate([
    (0, common_1.Post)('alerts/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateAlert", null);
__decorate([
    (0, common_1.Post)('playbooks'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPlaybook", null);
__decorate([
    (0, common_1.Post)('playbooks/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePlaybook", null);
__decorate([
    (0, common_1.Post)('hubs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createHub", null);
__decorate([
    (0, common_1.Post)('routes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createRoute", null);
__decorate([
    (0, common_1.Post)('commission/config'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCommissionConfig", null);
__decorate([
    (0, common_1.Post)('jarmenke/events'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createJarmenkeEvent", null);
__decorate([
    (0, common_1.Post)('access-list'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAccessList", null);
__decorate([
    (0, common_1.Post)('access-list/:id/remove'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeAccessList", null);
__decorate([
    (0, common_1.Post)('rate-limits'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createRateLimit", null);
__decorate([
    (0, common_1.Post)('fraud/signals/:id/resolve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveFraudSignal", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map