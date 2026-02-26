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
exports.AdminCommissionAnomalyResponseDto = exports.AdminCommissionAnomalyItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdminCommissionAnomalyItemDto {
}
exports.AdminCommissionAnomalyItemDto = AdminCommissionAnomalyItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminCommissionAnomalyItemDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionAnomalyItemDto.prototype, "expectedProductCommission", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionAnomalyItemDto.prototype, "expectedDeliveryCommission", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionAnomalyItemDto.prototype, "actualProductCommission", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionAnomalyItemDto.prototype, "actualDeliveryCommission", void 0);
class AdminCommissionAnomalyResponseDto {
}
exports.AdminCommissionAnomalyResponseDto = AdminCommissionAnomalyResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AdminCommissionAnomalyItemDto] }),
    __metadata("design:type", Array)
], AdminCommissionAnomalyResponseDto.prototype, "items", void 0);
//# sourceMappingURL=admin-commission-anomaly.dto.js.map