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
var FieldController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const field_service_1 = require("./field.service");
const create_field_job_dto_1 = require("./dto/create-field-job.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const client_1 = require("@prisma/client");
let FieldController = FieldController_1 = class FieldController {
    constructor(fieldService) {
        this.fieldService = fieldService;
        this.logger = new common_1.Logger(FieldController_1.name);
    }
    async createJob(req, dto) {
        const user = req.user;
        this.logger.log(`createJob body=${JSON.stringify(req.body)}`);
        this.logger.log(`createJob dto=${JSON.stringify(dto)}`);
        try {
            return await this.fieldService.createJob(user.id, dto);
        }
        catch (error) {
            this.logger.error('createJob failed', error instanceof Error ? error.stack : `${error}`);
            throw error;
        }
    }
    async listJobs() {
        return this.fieldService.listJobs();
    }
    async getJob(id) {
        return this.fieldService.getJob(id);
    }
    async acceptJob(id, req) {
        const user = req.user;
        return this.fieldService.acceptJob(id, user.id);
    }
    async startJob(id, req) {
        const user = req.user;
        return this.fieldService.startJob(id, user.id);
    }
    async completeJob(id, req) {
        const user = req.user;
        return this.fieldService.completeJob(id, user.id);
    }
    async cancelJob(id, req) {
        const user = req.user;
        return this.fieldService.cancelJob(id, user.id);
    }
};
exports.FieldController = FieldController;
__decorate([
    (0, common_1.Post)('jobs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_field_job_dto_1.CreateFieldJobDto]),
    __metadata("design:returntype", Promise)
], FieldController.prototype, "createJob", null);
__decorate([
    (0, common_1.Get)('jobs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FieldController.prototype, "listJobs", null);
__decorate([
    (0, common_1.Get)('jobs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FieldController.prototype, "getJob", null);
__decorate([
    (0, common_1.Post)('jobs/:id/accept'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EXECUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FieldController.prototype, "acceptJob", null);
__decorate([
    (0, common_1.Post)('jobs/:id/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EXECUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FieldController.prototype, "startJob", null);
__decorate([
    (0, common_1.Post)('jobs/:id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.EXECUTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FieldController.prototype, "completeJob", null);
__decorate([
    (0, common_1.Post)('jobs/:id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FieldController.prototype, "cancelJob", null);
exports.FieldController = FieldController = FieldController_1 = __decorate([
    (0, common_1.Controller)('field'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [field_service_1.FieldService])
], FieldController);
//# sourceMappingURL=field.controller.js.map