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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async audit(userId, action, targetId, reason, meta) {
        await this.prisma.auditLog.create({
            data: {
                userId: userId ?? undefined,
                action,
                metaJson: { targetId, reason, ...meta },
            },
        });
    }
    async listOrders(query) {
        const limit = Math.min(parseInt(query.limit ?? '20', 10) || 20, 100);
        const cursor = query.cursor ?? undefined;
        const q = query.q?.trim();
        const where = q
            ? { listing: { title: { contains: q, mode: 'insensitive' } } }
            : {};
        const items = await this.prisma.order.findMany({
            where,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: { listing: true, buyer: { select: { id: true, displayName: true, email: true } }, seller: { select: { id: true, displayName: true } } },
        });
        const hasMore = items.length > limit;
        const result = hasMore ? items.slice(0, limit) : items;
        const nextCursor = hasMore ? result[result.length - 1]?.id ?? null : null;
        return { items: result, nextCursor };
    }
    async getOrder(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { listing: true, delivery: { include: { legs: true } }, legs: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return {
            order,
            deliveryRequest: order.delivery,
            legs: order.legs ?? [],
            proofEvents: [],
            deliveryReasonStuck: null,
            commissionEntries: [],
        };
    }
    async listStuck() {
        const legs = await this.prisma.deliveryLeg.findMany({
            where: {
                status: { in: ['OFFERING', 'ACCEPTED', 'STARTED', 'ARRIVED'] },
            },
            orderBy: [{ orderId: 'asc' }, { sortOrder: 'asc' }],
        });
        const proofByLeg = new Map();
        const legIds = legs.map((l) => l.id);
        const proofs = await this.prisma.proofEvent.findMany({
            where: { legId: { in: legIds }, eventType: 'LEG_ARRIVED' },
            select: { legId: true },
        });
        proofs.forEach((p) => {
            if (p.legId)
                proofByLeg.set(p.legId, true);
        });
        const stuckByOrder = new Map();
        const reasonPriority = {
            WAITING_PROOF: 4,
            LEG2_BLOCKED: 3,
            NO_DRIVER: 2,
            TIMEOUT: 1,
        };
        for (const leg of legs) {
            const orderId = leg.orderId;
            const requestId = leg.requestId;
            let reason = null;
            if (leg.status === 'ARRIVED' && leg.toHubId && !proofByLeg.get(leg.id)) {
                reason = 'WAITING_PROOF';
            }
            else if (leg.status === 'ACCEPTED' && !leg.driverId && (leg.sortOrder ?? 0) > 1) {
                reason = 'LEG2_BLOCKED';
            }
            else if (leg.status === 'OFFERING') {
                reason = 'NO_DRIVER';
            }
            else if ((leg.status === 'STARTED' || leg.status === 'ARRIVED') && leg.driverId) {
                const updatedAt = leg.updatedAt ?? leg.createdAt ?? new Date();
                const ageMin = (Date.now() - new Date(updatedAt).getTime()) / 60_000;
                if (ageMin > 60)
                    reason = 'TIMEOUT';
            }
            if (reason) {
                const existing = stuckByOrder.get(orderId);
                if (!existing || reasonPriority[reason] > reasonPriority[existing.reason]) {
                    stuckByOrder.set(orderId, {
                        orderId,
                        requestId,
                        legId: leg.id,
                        legStatus: leg.status,
                        driverId: leg.driverId,
                        lastUpdatedAt: leg.updatedAt ?? leg.createdAt ?? new Date(),
                        reason,
                        priority: reasonPriority[reason],
                    });
                }
            }
        }
        return Array.from(stuckByOrder.values()).map(({ priority: _, ...rest }) => rest);
    }
    async listDisputes(query) {
        const statusFilter = query.status?.trim();
        const orderIdFilter = query.orderId?.trim();
        const where = {};
        if (statusFilter)
            where.status = statusFilter;
        if (orderIdFilter)
            where.orderId = orderIdFilter;
        const items = await this.prisma.orderDispute.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return { items };
    }
    async getDisputeDetail(id) {
        const dispute = await this.prisma.orderDispute.findUnique({
            where: { id },
            include: { order: { select: { id: true, status: true, totalAmount: true, buyerId: true, sellerId: true } } },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        return {
            id: dispute.id,
            orderId: dispute.orderId,
            status: dispute.status,
            reason: dispute.reason,
            resolution: dispute.resolution,
            resolutionNote: dispute.resolutionNote,
            createdAt: dispute.createdAt,
            updatedAt: dispute.updatedAt,
            order: dispute.order,
        };
    }
    async getStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const ordersToday = await this.prisma.order.count({
            where: { createdAt: { gte: todayStart } },
        });
        const orders7d = await this.prisma.order.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        });
        const activeDeliveries = await this.prisma.deliveryRequest.count({
            where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
        });
        const stuck = await this.listStuck();
        const commission7d = await this.prisma.commissionRecord.aggregate({
            where: { createdAt: { gte: sevenDaysAgo } },
            _sum: {
                productCommissionAmount: true,
                deliveryCommissionAmount: true,
            },
        });
        const commissionToday = await this.prisma.commissionRecord.aggregate({
            where: { createdAt: { gte: todayStart } },
            _sum: {
                productCommissionAmount: true,
                deliveryCommissionAmount: true,
            },
        });
        const chart7d = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayStart);
            d.setDate(d.getDate() - i);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            const [dayOrders, dayCommission] = await Promise.all([
                this.prisma.order.count({ where: { createdAt: { gte: d, lt: next } } }),
                this.prisma.commissionRecord.aggregate({
                    where: { createdAt: { gte: d, lt: next } },
                    _sum: { productCommissionAmount: true, deliveryCommissionAmount: true },
                }),
            ]);
            chart7d.push({
                date: d.toISOString().slice(0, 10),
                orders: dayOrders,
                commission: (dayCommission._sum.productCommissionAmount ?? 0) + (dayCommission._sum.deliveryCommissionAmount ?? 0),
            });
        }
        return {
            ordersToday,
            orders7d,
            activeDeliveries,
            stuckDeliveries: stuck.length,
            commissionToday: (commissionToday._sum.productCommissionAmount ?? 0) + (commissionToday._sum.deliveryCommissionAmount ?? 0),
            commission7d: (commission7d._sum.productCommissionAmount ?? 0) + (commission7d._sum.deliveryCommissionAmount ?? 0),
            chart7d,
        };
    }
    async listAudit(query) {
        const limit = Math.min(parseInt(query.limit ?? '20', 10) || 20, 100);
        const cursor = query.cursor ?? undefined;
        const actionFilter = query.action?.trim();
        const where = actionFilter ? { action: actionFilter } : {};
        const items = await this.prisma.auditLog.findMany({
            where,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
        });
        const hasMore = items.length > limit;
        const result = hasMore ? items.slice(0, limit) : items;
        const nextCursor = hasMore ? result[result.length - 1]?.id ?? null : null;
        const userIds = [...new Set(result.map((a) => a.userId).filter(Boolean))];
        const users = userIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, displayName: true, email: true },
            })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u]));
        return {
            items: result.map((a) => ({
                id: a.id,
                action: a.action,
                metaJson: a.metaJson,
                createdAt: a.createdAt,
                actor: a.userId ? userMap.get(a.userId) ?? null : null,
            })),
            nextCursor,
        };
    }
    async listUsers(query) {
        const limit = Math.min(parseInt(query.limit ?? '20', 10) || 20, 100);
        const cursor = query.cursor ?? undefined;
        const q = query.q?.trim();
        const where = q
            ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] }
            : {};
        const items = await this.prisma.user.findMany({
            where,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, phone: true, displayName: true, role: true, status: true, createdAt: true },
        });
        const hasMore = items.length > limit;
        const result = hasMore ? items.slice(0, limit) : items;
        const nextCursor = hasMore ? result[result.length - 1]?.id ?? null : null;
        return { items: result, nextCursor };
    }
    async getUserDetail(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, displayName: true, email: true, phone: true, role: true, status: true, createdAt: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const [ordersAsBuyer, ordersAsSeller, activeDeliveriesAsDriver, completedLegsAsDriver] = await Promise.all([
            this.prisma.order.count({ where: { buyerId: id } }),
            this.prisma.order.count({ where: { sellerId: id } }),
            this.prisma.deliveryLeg.count({ where: { driverId: id, status: { in: ['ACCEPTED', 'STARTED', 'ARRIVED'] } } }),
            this.prisma.deliveryLeg.count({ where: { driverId: id, status: 'COMPLETED' } }),
        ]);
        return {
            ...user,
            ordersAsBuyer,
            ordersAsSeller,
            activeDeliveriesAsDriver,
            completedLegsAsDriver,
        };
    }
    async listAlerts() {
        return this.prisma.alertConfig.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async listPlaybooks() {
        return this.prisma.incidentPlaybook.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async listSlas() {
        return this.prisma.deliverySlaConfig.findMany({ orderBy: { legSortOrder: 'asc' } });
    }
    async getInfraHealth() {
        return { activeHubs: 0, inactiveHubs: 0, duplicateHubsCount: 0, activeRoutes: 0, duplicateRoutesCount: 0, orphanRoutes: 0, routeWithInactiveHub: 0 };
    }
    async getInfraOrphans() {
        return [];
    }
    async listHubs() {
        return this.prisma.hub.findMany({ orderBy: { createdAt: 'desc' } }).then((hubs) => hubs.map((h) => ({ ...h, activeRouteCount: 0, linkedDeliveryCount: 0, isDuplicate: false, duplicateGroupId: null })));
    }
    async listRoutes() {
        return this.prisma.taxiRoute.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async listCommissionConfig() {
        return [];
    }
    async listCommissionLedger() {
        return { items: [] };
    }
    async listCommissionAnomalies() {
        return { items: [] };
    }
    async listJarmenkeEvents() {
        return [];
    }
    async listAccessList() {
        return [];
    }
    async listFraudSignals() {
        return [];
    }
    async listRateLimits() {
        return [];
    }
    async cancelOrder(orderId, userId, reason) {
        if (!reason?.trim())
            throw new common_1.BadRequestException('reason is required');
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.CANCELLED },
            });
            await this.prisma.deliveryRequest.updateMany({
                where: { orderId },
                data: { status: client_1.DeliveryRequestStatus.CANCELLED },
            });
            await this.audit(userId, 'admin.order.cancel', orderId, reason);
        }
        return { ok: true };
    }
    async reassignLeg(legId, userId, driverId, reason) {
        const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
        if (!leg)
            throw new common_1.NotFoundException('Leg not found');
        if (!reason?.trim())
            throw new common_1.BadRequestException('reason is required');
        await this.prisma.deliveryLeg.update({
            where: { id: legId },
            data: { driverId },
        });
        await this.audit(userId, 'admin.delivery.leg.reassign', legId, reason, { driverId, orderId: leg.orderId });
        return { ok: true };
    }
    async unlockMainline(legId, userId, reason) {
        const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
        if (!leg)
            throw new common_1.NotFoundException('Leg not found');
        if (!reason?.trim())
            throw new common_1.BadRequestException('reason is required');
        await this.prisma.deliveryLeg.update({
            where: { id: legId },
            data: { status: client_1.DeliveryLegStatus.OFFERING, driverId: null },
        });
        await this.audit(userId, 'admin.delivery.leg.unlock', legId, reason, { orderId: leg.orderId });
        return { ok: true };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map