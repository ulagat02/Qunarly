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
exports.AdminStuckItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdminStuckItemDto {
}
exports.AdminStuckItemDto = AdminStuckItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order-id' }),
    __metadata("design:type", String)
], AdminStuckItemDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'request-id' }),
    __metadata("design:type", String)
], AdminStuckItemDto.prototype, "requestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'leg-id', nullable: true }),
    __metadata("design:type", Object)
], AdminStuckItemDto.prototype, "legId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'OFFERING' }),
    __metadata("design:type", String)
], AdminStuckItemDto.prototype, "legStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'driver-id', nullable: true }),
    __metadata("design:type", Object)
], AdminStuckItemDto.prototype, "driverId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-12T10:00:00.000Z' }),
    __metadata("design:type", Date)
], AdminStuckItemDto.prototype, "lastUpdatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'WAITING_PROOF' }),
    __metadata("design:type", String)
], AdminStuckItemDto.prototype, "reason", void 0);
//# sourceMappingURL=admin-stuck-item.dto.js.map