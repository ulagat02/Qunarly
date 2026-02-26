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
exports.VillagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const regions_service_1 = require("./regions.service");
let VillagesController = class VillagesController {
    constructor(regionsService) {
        this.regionsService = regionsService;
    }
    async listVillages(districtId, q, limit) {
        if (!districtId) {
            throw new common_1.BadRequestException('districtId is required');
        }
        const take = limit ? Math.min(Number(limit), 200) : 50;
        if (!Number.isFinite(take) || take <= 0) {
            throw new common_1.BadRequestException('limit is invalid');
        }
        return this.regionsService.listSettlements(districtId, q, take);
    }
};
exports.VillagesController = VillagesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('districtId')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], VillagesController.prototype, "listVillages", null);
exports.VillagesController = VillagesController = __decorate([
    (0, swagger_1.ApiTags)('Villages'),
    (0, common_1.Controller)('villages'),
    __metadata("design:paramtypes", [regions_service_1.RegionsService])
], VillagesController);
//# sourceMappingURL=villages.controller.js.map