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
exports.AdminJarmenkeEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AdminJarmenkeEventDto {
}
exports.AdminJarmenkeEventDto = AdminJarmenkeEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-01T00:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AdminJarmenkeEventDto.prototype, "startAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-07T23:59:59.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AdminJarmenkeEventDto.prototype, "endAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminJarmenkeEventDto.prototype, "productRateOverridePercent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminJarmenkeEventDto.prototype, "deliveryRateOverridePercent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Weekly fair override' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminJarmenkeEventDto.prototype, "reason", void 0);
//# sourceMappingURL=admin-jarmenke-event.dto.js.map