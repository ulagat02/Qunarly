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
exports.CreateFieldJobDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateFieldJobDto {
}
exports.CreateFieldJobDto = CreateFieldJobDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'service-type-id' }),
    __metadata("design:type", String)
], CreateFieldJobDto.prototype, "serviceTypeId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 120 }),
    __metadata("design:type", Number)
], CreateFieldJobDto.prototype, "areaHa", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 43.238949 }),
    __metadata("design:type", Number)
], CreateFieldJobDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 76.889709 }),
    __metadata("design:type", Number)
], CreateFieldJobDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiPropertyOptional)({ example: 'Алматы облысы, Қарасай' }),
    __metadata("design:type", String)
], CreateFieldJobDto.prototype, "pickupAddressText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'Алматы облысы' }),
    __metadata("design:type", String)
], CreateFieldJobDto.prototype, "pickupRegion", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 1200 }),
    __metadata("design:type", Number)
], CreateFieldJobDto.prototype, "cargoWeightKg", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 18 }),
    __metadata("design:type", Number)
], CreateFieldJobDto.prototype, "cargoVolumeM3", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'GRAIN' }),
    __metadata("design:type", String)
], CreateFieldJobDto.prototype, "cargoType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiPropertyOptional)({ example: 12 }),
    __metadata("design:type", Number)
], CreateFieldJobDto.prototype, "distanceKm", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiPropertyOptional)({ example: 'Суару қажет, 2 күн ішінде' }),
    __metadata("design:type", String)
], CreateFieldJobDto.prototype, "notes", void 0);
//# sourceMappingURL=create-field-job.dto.js.map