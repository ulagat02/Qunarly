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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnsureRouteDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class EnsureRouteDto {
}
exports.EnsureRouteDto = EnsureRouteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'origin-hub-id' }),
    __metadata("design:type", String)
], EnsureRouteDto.prototype, "originHubId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'dest-hub-id' }),
    __metadata("design:type", String)
], EnsureRouteDto.prototype, "destHubId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['VILLAGE_TO_DISTRICT', 'DISTRICT_TO_CITY', 'VILLAGE_TO_CITY']),
    (0, swagger_1.ApiProperty)({ example: 'VILLAGE_TO_DISTRICT' }),
    __metadata("design:type", String)
], EnsureRouteDto.prototype, "routeType", void 0);
//# sourceMappingURL=ensure-route.dto.js.map