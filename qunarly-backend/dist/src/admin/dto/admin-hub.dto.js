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
exports.AdminHubUpsertDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AdminHubUpsertDto {
}
exports.AdminHubUpsertDto = AdminHubUpsertDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Алматы Хаб' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminHubUpsertDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 43.2389 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdminHubUpsertDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 76.889 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdminHubUpsertDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.8 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminHubUpsertDto.prototype, "radiusKm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'region-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminHubUpsertDto.prototype, "regionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'district-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminHubUpsertDto.prototype, "districtId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AdminHubUpsertDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Update hub config' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminHubUpsertDto.prototype, "reason", void 0);
//# sourceMappingURL=admin-hub.dto.js.map