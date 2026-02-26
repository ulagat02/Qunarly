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
exports.AdminOrderListResponseDto = exports.AdminOrderListItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class AdminOrderListItemDto {
}
exports.AdminOrderListItemDto = AdminOrderListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'order-id' }),
    __metadata("design:type", String)
], AdminOrderListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.OrderStatus }),
    __metadata("design:type", String)
], AdminOrderListItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1500 }),
    __metadata("design:type", Object)
], AdminOrderListItemDto.prototype, "totalAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'buyer-id' }),
    __metadata("design:type", Object)
], AdminOrderListItemDto.prototype, "buyerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'seller-id' }),
    __metadata("design:type", Object)
], AdminOrderListItemDto.prototype, "sellerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'listing-id' }),
    __metadata("design:type", Object)
], AdminOrderListItemDto.prototype, "listingId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Wheat' }),
    __metadata("design:type", Object)
], AdminOrderListItemDto.prototype, "listingTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'CREATED' }),
    __metadata("design:type", Object)
], AdminOrderListItemDto.prototype, "deliveryStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-12T10:00:00.000Z' }),
    __metadata("design:type", Date)
], AdminOrderListItemDto.prototype, "createdAt", void 0);
class AdminOrderListResponseDto {
}
exports.AdminOrderListResponseDto = AdminOrderListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AdminOrderListItemDto] }),
    __metadata("design:type", Array)
], AdminOrderListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'order-id' }),
    __metadata("design:type", Object)
], AdminOrderListResponseDto.prototype, "nextCursor", void 0);
//# sourceMappingURL=admin-order-list-item.dto.js.map