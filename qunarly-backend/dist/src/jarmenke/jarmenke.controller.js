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
exports.JarmenkeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const client_1 = require("@prisma/client");
const jarmenke_service_1 = require("./jarmenke.service");
const create_event_dto_1 = require("./dto/create-event.dto");
let JarmenkeController = class JarmenkeController {
    constructor(jarmenkeService) {
        this.jarmenkeService = jarmenkeService;
    }
    async createEvent(dto) {
        return this.jarmenkeService.createEvent(dto);
    }
    async analytics(from, to) {
        return this.jarmenkeService.getAnalytics(from, to);
    }
};
exports.JarmenkeController = JarmenkeController;
__decorate([
    (0, common_1.Post)('events'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_event_dto_1.CreateJarmenkeEventDto]),
    __metadata("design:returntype", Promise)
], JarmenkeController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JarmenkeController.prototype, "analytics", null);
exports.JarmenkeController = JarmenkeController = __decorate([
    (0, swagger_1.ApiTags)('jarmenke'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('jarmenke'),
    __metadata("design:paramtypes", [jarmenke_service_1.JarmenkeService])
], JarmenkeController);
//# sourceMappingURL=jarmenke.controller.js.map