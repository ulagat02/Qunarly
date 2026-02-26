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
exports.AdminAuditLogResponseDto = exports.AdminAuditLogItemDto = exports.AdminAuditActorDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdminAuditActorDto {
}
exports.AdminAuditActorDto = AdminAuditActorDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user-id' }),
    __metadata("design:type", Object)
], AdminAuditActorDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user@example.com' }),
    __metadata("design:type", Object)
], AdminAuditActorDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Admin User' }),
    __metadata("design:type", Object)
], AdminAuditActorDto.prototype, "displayName", void 0);
class AdminAuditLogItemDto {
}
exports.AdminAuditLogItemDto = AdminAuditLogItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'audit-id' }),
    __metadata("design:type", String)
], AdminAuditLogItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin.order.cancel' }),
    __metadata("design:type", String)
], AdminAuditLogItemDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-02-12T10:00:00.000Z' }),
    __metadata("design:type", Object)
], AdminAuditLogItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Object,
        example: { targetType: 'Order', targetId: 'order-id', reason: 'manual override' },
    }),
    __metadata("design:type", Object)
], AdminAuditLogItemDto.prototype, "metaJson", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: AdminAuditActorDto,
        example: { id: 'user-id', email: 'admin@example.com', displayName: 'Бас Әкімші' },
    }),
    __metadata("design:type", Object)
], AdminAuditLogItemDto.prototype, "actor", void 0);
class AdminAuditLogResponseDto {
}
exports.AdminAuditLogResponseDto = AdminAuditLogResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AdminAuditLogItemDto] }),
    __metadata("design:type", Array)
], AdminAuditLogResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'audit-id' }),
    __metadata("design:type", Object)
], AdminAuditLogResponseDto.prototype, "nextCursor", void 0);
//# sourceMappingURL=admin-audit-log-item.dto.js.map