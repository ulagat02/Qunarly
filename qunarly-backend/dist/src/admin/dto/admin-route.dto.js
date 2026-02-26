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
exports.AdminRouteUpsertDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class AdminRouteUpsertDto {
}
exports.AdminRouteUpsertDto = AdminRouteUpsertDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'hub-from-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminRouteUpsertDto.prototype, "fromHubId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'hub-to-id' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminRouteUpsertDto.prototype, "toHubId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.RouteType }),
    (0, class_validator_1.IsEnum)(client_1.RouteType),
    __metadata("design:type", String)
], AdminRouteUpsertDto.prototype, "routeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Route label' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminRouteUpsertDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AdminRouteUpsertDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.RouteStatus }),
    (0, class_validator_1.IsEnum)(client_1.RouteStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdminRouteUpsertDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Route maintenance' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdminRouteUpsertDto.prototype, "reason", void 0);
//# sourceMappingURL=admin-route.dto.js.map