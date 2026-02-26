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
exports.AdminStatsDto = exports.AdminStatsDayDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AdminStatsDayDto {
}
exports.AdminStatsDayDto = AdminStatsDayDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-12' }),
    __metadata("design:type", String)
], AdminStatsDayDto.prototype, "day", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12 }),
    __metadata("design:type", Number)
], AdminStatsDayDto.prototype, "orders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 8 }),
    __metadata("design:type", Number)
], AdminStatsDayDto.prototype, "deliveries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], AdminStatsDayDto.prototype, "stuck", void 0);
class AdminStatsDto {
}
exports.AdminStatsDto = AdminStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], AdminStatsDto.prototype, "ordersToday", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 21 }),
    __metadata("design:type", Number)
], AdminStatsDto.prototype, "orders7d", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], AdminStatsDto.prototype, "activeDeliveries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], AdminStatsDto.prototype, "stuckDeliveries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 225 }),
    __metadata("design:type", Number)
], AdminStatsDto.prototype, "commissionToday", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 980 }),
    __metadata("design:type", Number)
], AdminStatsDto.prototype, "commission7d", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [AdminStatsDayDto],
        example: [
            { day: '2026-02-06', orders: 4, deliveries: 3, stuck: 1 },
            { day: '2026-02-07', orders: 2, deliveries: 2, stuck: 0 },
        ],
    }),
    __metadata("design:type", Array)
], AdminStatsDto.prototype, "chart7d", void 0);
//# sourceMappingURL=admin-stats.dto.js.map