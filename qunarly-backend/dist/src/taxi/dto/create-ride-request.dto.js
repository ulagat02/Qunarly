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
exports.CreateRideRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateRideRequestDto {
}
exports.CreateRideRequestDto = CreateRideRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'route-id' }),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "routeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'дүкен қасы' }),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "pickupText", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], CreateRideRequestDto.prototype, "seats", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['NONE', 'SMALL', 'LARGE']),
    (0, swagger_1.ApiProperty)({ example: 'NONE' }),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "cargoType", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['TODAY', 'TOMORROW']),
    (0, swagger_1.ApiProperty)({ example: 'TODAY' }),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "departureType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    __metadata("design:type", Boolean)
], CreateRideRequestDto.prototype, "waitUntilFull", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, swagger_1.ApiProperty)({ example: 'uuid-from-client', required: false }),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "clientRequestId", void 0);
//# sourceMappingURL=create-ride-request.dto.js.map