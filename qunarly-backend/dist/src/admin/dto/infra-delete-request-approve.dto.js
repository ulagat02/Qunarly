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
exports.InfraDeleteRequestRejectDto = exports.InfraDeleteRequestApproveDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class InfraDeleteRequestApproveDto {
}
exports.InfraDeleteRequestApproveDto = InfraDeleteRequestApproveDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Approved after review' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InfraDeleteRequestApproveDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required for hub when it has references; merge into this hub first' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InfraDeleteRequestApproveDto.prototype, "mergeTargetHubId", void 0);
class InfraDeleteRequestRejectDto {
}
exports.InfraDeleteRequestRejectDto = InfraDeleteRequestRejectDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Rejected - hub still needed' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InfraDeleteRequestRejectDto.prototype, "reason", void 0);
//# sourceMappingURL=infra-delete-request-approve.dto.js.map