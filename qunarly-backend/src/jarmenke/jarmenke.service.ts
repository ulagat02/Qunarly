import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class JarmenkeService {
  constructor(private prisma: PrismaService) {}

  async createEvent(dto: {
    startAt: string;
    endAt: string;
    productRateOverridePercent?: number;
    deliveryRateOverridePercent?: number;
  }) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid dates');
    }
    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be after startAt');
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

  async getAnalytics(from?: string, to?: string) {
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
    const commissionRevenue =
      (commissions._sum.productCommissionAmount ?? 0) + (commissions._sum.deliveryCommissionAmount ?? 0);
    return {
      turnover: orders._sum.totalAmount ?? 0,
      commissionRevenue,
      activeSellers: sellers.length,
      activeDrivers: drivers.length,
      from: fromDate,
      to: toDate,
    };
  }
}
