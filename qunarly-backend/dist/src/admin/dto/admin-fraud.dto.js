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
exports.AdminFraudResolveDto = exports.AdminFraudSignalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class AdminFraudSignalDto {
}
exports.AdminFraudSignalDto = AdminFraudSignalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.FraudSignalType }),
    (0, class_validator_1.IsEnum)(client_1.FraudSignalType),
    __metadata("design:type", String)
], AdminFraudSignalDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'order-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminFraudSignalDto.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminFraudSignalDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'hashed-ip' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminFraudSignalDto.prototype, "ipHash", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Suspicious pattern detected' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminFraudSignalDto.prototype, "reason", void 0);
class AdminFraudResolveDto {
}
exports.AdminFraudResolveDto = AdminFraudResolveDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.FraudSignalStatus }),
    (0, class_validator_1.IsEnum)(client_1.FraudSignalStatus),
    __metadata("design:type", String)
], AdminFraudResolveDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Reviewed and resolved' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminFraudResolveDto.prototype, "reason", void 0);
//# sourceMappingURL=admin-fraud.dto.js.map