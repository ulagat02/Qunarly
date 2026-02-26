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
exports.ConfirmPaymentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const PAYMENT_PROVIDERS = ['KASPI_QR'];
const PAYMENT_INTENT_STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'];
class ConfirmPaymentDto {
}
exports.ConfirmPaymentDto = ConfirmPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'order-id' }),
    __metadata("design:type", String)
], ConfirmPaymentDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(PAYMENT_PROVIDERS),
    (0, swagger_1.ApiProperty)({ enum: PAYMENT_PROVIDERS, example: 'KASPI_QR' }),
    __metadata("design:type", Object)
], ConfirmPaymentDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'external-ref' }),
    __metadata("design:type", String)
], ConfirmPaymentDto.prototype, "externalRef", void 0);
__decorate([
    (0, class_validator_1.IsIn)(PAYMENT_INTENT_STATUSES),
    (0, swagger_1.ApiProperty)({ enum: PAYMENT_INTENT_STATUSES, example: 'CONFIRMED' }),
    __metadata("design:type", Object)
], ConfirmPaymentDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ required: false, example: 'idempotency-key' }),
    __metadata("design:type", String)
], ConfirmPaymentDto.prototype, "idempotencyKey", void 0);
//# sourceMappingURL=confirm-payment.dto.js.map