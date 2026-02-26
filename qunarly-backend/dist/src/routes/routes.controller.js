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
exports.RoutesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const routes_service_1 = require("./routes.service");
const create_route_template_dto_1 = require("./dto/create-route-template.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let RoutesController = class RoutesController {
    constructor(routesService) {
        this.routesService = routesService;
    }
    async create(dto) {
        return this.routesService.create(dto);
    }
    async listFromHub(hubId) {
        return this.routesService.listFromHub(hubId);
    }
};
exports.RoutesController = RoutesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_route_template_dto_1.CreateRouteTemplateDto]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('from/:hubId'),
    __param(0, (0, common_1.Param)('hubId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoutesController.prototype, "listFromHub", null);
exports.RoutesController = RoutesController = __decorate([
    (0, swagger_1.ApiTags)('Routes'),
    (0, common_1.Controller)('routes'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [routes_service_1.RoutesService])
], RoutesController);
//# sourceMappingURL=routes.controller.js.map