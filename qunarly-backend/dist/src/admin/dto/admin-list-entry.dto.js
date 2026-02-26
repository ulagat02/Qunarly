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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminListEntryItemDto = exports.AdminListEntryCreateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class AdminListEntryCreateDto {
}
exports.AdminListEntryCreateDto = AdminListEntryCreateDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ListEntryType),
    (0, swagger_1.ApiProperty)({ enum: client_1.ListEntryType, example: 'PHONE' }),
    __metadata("design:type", typeof (_a = typeof client_1.ListEntryType !== "undefined" && client_1.ListEntryType) === "function" ? _a : Object)
], AdminListEntryCreateDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: '+77000000000' }),
    __metadata("design:type", String)
], AdminListEntryCreateDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, swagger_1.ApiProperty)({ example: 'Fraud prevention' }),
    __metadata("design:type", String)
], AdminListEntryCreateDto.prototype, "reason", void 0);
class AdminListEntryItemDto {
}
exports.AdminListEntryItemDto = AdminListEntryItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'entry-id' }),
    __metadata("design:type", String)
], AdminListEntryItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ListEntryType }),
    __metadata("design:type", typeof (_b = typeof client_1.ListEntryType !== "undefined" && client_1.ListEntryType) === "function" ? _b : Object)
], AdminListEntryItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+77000000000' }),
    __metadata("design:type", String)
], AdminListEntryItemDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Fraud prevention' }),
    __metadata("design:type", Object)
], AdminListEntryItemDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AdminListEntryItemDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-12T10:00:00.000Z' }),
    __metadata("design:type", Date)
], AdminListEntryItemDto.prototype, "createdAt", void 0);
//# sourceMappingURL=admin-list-entry.dto.js.map