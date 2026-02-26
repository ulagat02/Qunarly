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
exports.AdminCommissionLedgerResponseDto = exports.AdminCommissionLedgerItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdminCommissionLedgerItemDto {
}
exports.AdminCommissionLedgerItemDto = AdminCommissionLedgerItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminCommissionLedgerItemDto.prototype, "eventKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionLedgerItemDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionLedgerItemDto.prototype, "legId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionLedgerItemDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionLedgerItemDto.prototype, "rateApplied", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionLedgerItemDto.prototype, "legFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AdminCommissionLedgerItemDto.prototype, "createdAt", void 0);
class AdminCommissionLedgerResponseDto {
}
exports.AdminCommissionLedgerResponseDto = AdminCommissionLedgerResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AdminCommissionLedgerItemDto] }),
    __metadata("design:type", Array)
], AdminCommissionLedgerResponseDto.prototype, "items", void 0);
//# sourceMappingURL=admin-commission-ledger.dto.js.map