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
exports.JarmenkeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let JarmenkeService = class JarmenkeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createEvent(dto) {
        const startAt = new Date(dto.startAt);
        const endAt = new Date(dto.endAt);
        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
            throw new common_1.BadRequestException('Invalid dates');
        }
        if (endAt <= startAt) {
            throw new common_1.BadRequestException('endAt must be after startAt');
        }
        return this.prisma.jarmenkeEvent.create({
            data: {
                startAt,
                endAt,
                productRateOverridePercent: dto.productRateOverridePercent ?? undefined,
                deliveryRateOverridePercent: dto.deliveryRateOverridePercent ?? undefined,
            },
        });
    }
    async getAnalytics(from, to) {
        const fromDate = from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        const [orders, commissions, sellers, drivers] = await Promise.all([
            this.prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: fromDate, lte: toDate }, commerceStatus: 'PAID' },
            }),
            this.prisma.commissionRecord.aggregate({
                _sum: { productCommissionAmount: true, deliveryCommissionAmount: true },
                where: { createdAt: { gte: fromDate, lte: toDate } },
            }),
            this.prisma.order.findMany({
                where: { createdAt: { gte: fromDate, lte: toDate } },
                select: { sellerId: true },
                distinct: ['sellerId'],
            }),
            this.prisma.shipmentJob.findMany({
                where: { acceptedBy: { not: null } },
                select: { acceptedBy: true },
                distinct: ['acceptedBy'],
            }),
        ]);
        const commissionRevenue = (commissions._sum.productCommissionAmount ?? 0) + (commissions._sum.deliveryCommissionAmount ?? 0);
        return {
            turnover: orders._sum.totalAmount ?? 0,
            commissionRevenue,
            activeSellers: sellers.length,
            activeDrivers: drivers.length,
            from: fromDate,
            to: toDate,
        };
    }
};
exports.JarmenkeService = JarmenkeService;
exports.JarmenkeService = JarmenkeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JarmenkeService);
//# sourceMappingURL=jarmenke.service.js.map