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
exports.AdminUserListResponseDto = exports.AdminUserListItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class AdminUserListItemDto {
}
exports.AdminUserListItemDto = AdminUserListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-id' }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'User Name' }),
    __metadata("design:type", Object)
], AdminUserListItemDto.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user@example.com' }),
    __metadata("design:type", Object)
], AdminUserListItemDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+77000000000' }),
    __metadata("design:type", Object)
], AdminUserListItemDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserRole }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.UserStatus }),
    __metadata("design:type", String)
], AdminUserListItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-12T10:00:00.000Z' }),
    __metadata("design:type", Date)
], AdminUserListItemDto.prototype, "createdAt", void 0);
class AdminUserListResponseDto {
}
exports.AdminUserListResponseDto = AdminUserListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AdminUserListItemDto] }),
    __metadata("design:type", Array)
], AdminUserListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user-id' }),
    __metadata("design:type", Object)
], AdminUserListResponseDto.prototype, "nextCursor", void 0);
//# sourceMappingURL=admin-user-list-item.dto.js.map