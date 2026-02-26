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
exports.CreateShipmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateShipmentDto {
}
exports.CreateShipmentDto = CreateShipmentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiPropertyOptional)({ example: 'deal-id' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "dealId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiPropertyOptional)({ example: 'contract-id' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "contractId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 43.238949 }),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "originLat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 76.889709 }),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "originLng", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'Алматы облысы, Қарасай' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "originAddressText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'Алматы облысы' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "originRegion", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 43.310001 }),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "destLat", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 76.940001 }),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "destLng", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'Алматы қ., Әуезов' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "destAddressText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'Алматы қ.' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "destRegion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiPropertyOptional)({ example: 'Астық' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "cargoDescription", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'GRAIN' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "cargoType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 1200 }),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "weightKg", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiProperty)({ example: 18 }),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "volumeM3", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiPropertyOptional)({ example: 'PALLET' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "packageType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiPropertyOptional)({ example: 'Абаяй қаптаңыз' }),
    __metadata("design:type", String)
], CreateShipmentDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, swagger_1.ApiPropertyOptional)({ example: 35000 }),
    __metadata("design:type", Number)
], CreateShipmentDto.prototype, "priceOffer", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiPropertyOptional)({ example: { description: 'Астық', weightKg: 1200 } }),
    __metadata("design:type", Object)
], CreateShipmentDto.prototype, "cargoJson", void 0);
//# sourceMappingURL=create-shipment.dto.js.map