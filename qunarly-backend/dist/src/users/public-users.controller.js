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
exports.PublicUsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const public_rate_limit_guard_1 = require("../common/public-rate-limit.guard");
let PublicUsersController = class PublicUsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getPublicProfile(id) {
        return this.usersService.getPublicProfile(id);
    }
};
exports.PublicUsersController = PublicUsersController;
__decorate([
    (0, common_1.Get)(':id/public'),
    (0, common_1.UseGuards)(public_rate_limit_guard_1.PublicRateLimitGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicUsersController.prototype, "getPublicProfile", null);
exports.PublicUsersController = PublicUsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], PublicUsersController);
//# sourceMappingURL=public-users.controller.js.map