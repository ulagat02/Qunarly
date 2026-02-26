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
exports.UpdateListingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_listing_dto_1 = require("./create-listing.dto");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const price_tier_dto_1 = require("./price-tier.dto");
class UpdateListingDto extends (0, mapped_types_1.PartialType)(create_listing_dto_1.CreateListingDto) {
}
exports.UpdateListingDto = UpdateListingDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ProductListingStatus),
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ProductListingStatus, example: client_1.ProductListingStatus.PUBLISHED }),
    __metadata("design:type", String)
], UpdateListingDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, swagger_1.ApiPropertyOptional)({ example: ['file-id-1', 'file-id-2'] }),
    __metadata("design:type", Array)
], UpdateListingDto.prototype, "imageFileIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => price_tier_dto_1.PriceTierDto),
    (0, swagger_1.ApiPropertyOptional)({ type: [price_tier_dto_1.PriceTierDto] }),
    __metadata("design:type", Array)
], UpdateListingDto.prototype, "tiers", void 0);
//# sourceMappingURL=update-listing.dto.js.map