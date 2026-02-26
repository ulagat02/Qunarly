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
exports.AdminAccessListDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class AdminAccessListDto {
}
exports.AdminAccessListDto = AdminAccessListDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AccessListType }),
    (0, class_validator_1.IsEnum)(client_1.AccessListType),
    __metadata("design:type", typeof (_a = typeof client_1.AccessListType !== "undefined" && client_1.AccessListType) === "function" ? _a : Object)
], AdminAccessListDto.prototype, "listType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AccessListTarget }),
    (0, class_validator_1.IsEnum)(client_1.AccessListTarget),
    __metadata("design:type", typeof (_b = typeof client_1.AccessListTarget !== "undefined" && client_1.AccessListTarget) === "function" ? _b : Object)
], AdminAccessListDto.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user-id-or-phone' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminAccessListDto.prototype, "targetValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Suspicious activity' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminAccessListDto.prototype, "reason", void 0);
//# sourceMappingURL=admin-access-list.dto.js.map