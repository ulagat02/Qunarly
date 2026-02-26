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
var DistrictsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistrictsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const regions_service_1 = require("./regions.service");
let DistrictsController = DistrictsController_1 = class DistrictsController {
    constructor(regionsService) {
        this.regionsService = regionsService;
        this.logger = new common_1.Logger(DistrictsController_1.name);
    }
    async list(regionId) {
        if (!regionId) {
            throw new common_1.BadRequestException('regionId is required');
        }
        this.logger.log(`list: regionId=${regionId}`);
        return this.regionsService.listDistricts(regionId);
    }
};
exports.DistrictsController = DistrictsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('regionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DistrictsController.prototype, "list", null);
exports.DistrictsController = DistrictsController = DistrictsController_1 = __decorate([
    (0, swagger_1.ApiTags)('Districts'),
    (0, common_1.Controller)('districts'),
    __metadata("design:paramtypes", [regions_service_1.RegionsService])
], DistrictsController);
//# sourceMappingURL=districts.controller.js.map