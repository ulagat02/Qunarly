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
exports.InfraRouteDuplicatesResolveDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class InfraRouteDuplicatesResolveDto {
}
exports.InfraRouteDuplicatesResolveDto = InfraRouteDuplicatesResolveDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'route-id-to-keep' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InfraRouteDuplicatesResolveDto.prototype, "keepRouteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['route-id-1', 'route-id-2'], type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], InfraRouteDuplicatesResolveDto.prototype, "mergeRouteIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Deduplicate routes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InfraRouteDuplicatesResolveDto.prototype, "reason", void 0);
//# sourceMappingURL=infra-route-duplicates-resolve.dto.js.map