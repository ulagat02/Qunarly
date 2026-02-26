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
exports.AdminOrderDetailDto = exports.AdminCommissionEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdminCommissionEntryDto {
}
exports.AdminCommissionEntryDto = AdminCommissionEntryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'commission:delivery:orderId:legId:HANDOFF_COMPLETED' }),
    __metadata("design:type", Object)
], AdminCommissionEntryDto.prototype, "eventKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'order-id' }),
    __metadata("design:type", Object)
], AdminCommissionEntryDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'leg-id' }),
    __metadata("design:type", Object)
], AdminCommissionEntryDto.prototype, "legId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 7.5 }),
    __metadata("design:type", Object)
], AdminCommissionEntryDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0.03 }),
    __metadata("design:type", Object)
], AdminCommissionEntryDto.prototype, "rateApplied", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 250 }),
    __metadata("design:type", Object)
], AdminCommissionEntryDto.prototype, "legFee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-02-12T10:00:00.000Z' }),
    __metadata("design:type", Object)
], AdminCommissionEntryDto.prototype, "createdAt", void 0);
class AdminOrderDetailDto {
}
exports.AdminOrderDetailDto = AdminOrderDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            id: 'order-id',
            status: 'PLACED',
            totalAmount: 1500,
        },
    }),
    __metadata("design:type", Object)
], AdminOrderDetailDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: {
            id: 'request-id',
            status: 'LEG1',
        },
    }),
    __metadata("design:type", Object)
], AdminOrderDetailDto.prototype, "deliveryRequest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [Object],
        example: [{ id: 'leg-id', status: 'OFFERING', price: 250 }],
    }),
    __metadata("design:type", Array)
], AdminOrderDetailDto.prototype, "legs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [Object],
        example: [{ id: 'proof-id', eventType: 'LEG_ARRIVED' }],
    }),
    __metadata("design:type", Array)
], AdminOrderDetailDto.prototype, "proofEvents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'WAITING_PROOF' }),
    __metadata("design:type", Object)
], AdminOrderDetailDto.prototype, "deliveryReasonStuck", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [AdminCommissionEntryDto],
        example: [
            {
                eventKey: 'commission:delivery:order-id:leg-id:HANDOFF_COMPLETED',
                orderId: 'order-id',
                legId: 'leg-id',
                amount: 7.5,
                rateApplied: 0.03,
                legFee: 250,
                createdAt: '2026-02-12T10:00:00.000Z',
            },
        ],
    }),
    __metadata("design:type", Array)
], AdminOrderDetailDto.prototype, "commissionEntries", void 0);
//# sourceMappingURL=admin-order-detail.dto.js.map