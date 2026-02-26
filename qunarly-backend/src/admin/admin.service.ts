import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { DeliveryLegStatus, DeliveryRequestStatus, OrderStatus, DisputeStatus, FraudSignalStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async audit(userId: string | undefined, action: string, targetId: string, reason: string, meta?: Record<string, unknown>) {
    await this.prisma.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        metaJson: { targetId, reason, ...meta } as object,
      },
    });
  }

  async listOrders(query: Record<string, string>) {
    const limit = Math.min(parseInt(query.limit ?? '20', 10) || 20, 100);
    const cursor = query.cursor ?? undefined;
    const q = query.q?.trim();
    const where = q
      ? { listing: { title: { contains: q, mode: 'insensitive' as const } } }
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

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { listing: true, delivery: { include: { legs: true } }, legs: true },
    });
    if (!order) throw new NotFoundException('Order not found');
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
    type StuckReason = 'WAITING_PROOF' | 'LEG2_BLOCKED' | 'NO_DRIVER' | 'TIMEOUT';
    const legs = await this.prisma.deliveryLeg.findMany({
      where: {
        status: { in: ['OFFERING', 'ACCEPTED', 'STARTED', 'ARRIVED'] as any },
      },
      orderBy: [{ orderId: 'asc' }, { sortOrder: 'asc' }],
    });

    const proofByLeg = new Map<string, boolean>();
    const legIds = legs.map((l) => l.id);
    const proofs = await this.prisma.proofEvent.findMany({
      where: { legId: { in: legIds }, eventType: 'LEG_ARRIVED' as any },
      select: { legId: true },
    });
    proofs.forEach((p) => {
      if (p.legId) proofByLeg.set(p.legId, true);
    });

    const stuckByOrder = new Map<
      string,
      { orderId: string; requestId: string; legId: string | null; legStatus: string; driverId: string | null; lastUpdatedAt: Date; reason: StuckReason; priority: number }
    >();
    const reasonPriority: Record<StuckReason, number> = {
      WAITING_PROOF: 4,
      LEG2_BLOCKED: 3,
      NO_DRIVER: 2,
      TIMEOUT: 1,
    };

    for (const leg of legs) {
      const orderId = leg.orderId;
      const requestId = leg.requestId;
      let reason: StuckReason | null = null;

      if (leg.status === 'ARRIVED' && leg.toHubId && !proofByLeg.get(leg.id)) {
        reason = 'WAITING_PROOF';
      } else if (leg.status === 'ACCEPTED' && !leg.driverId && (leg.sortOrder ?? 0) > 1) {
        reason = 'LEG2_BLOCKED';
      } else if (leg.status === 'OFFERING') {
        reason = 'NO_DRIVER';
      } else if ((leg.status === 'STARTED' || leg.status === 'ARRIVED') && leg.driverId) {
        const updatedAt = leg.updatedAt ?? leg.createdAt ?? new Date();
        const ageMin = (Date.now() - new Date(updatedAt).getTime()) / 60_000;
        if (ageMin > 60) reason = 'TIMEOUT';
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

  async listDisputes(query: Record<string, string>) {
    const statusFilter = query.status?.trim();
    const orderIdFilter = query.orderId?.trim();
    const where: Record<string, unknown> = {};
    if (statusFilter) where.status = statusFilter;
    if (orderIdFilter) where.orderId = orderIdFilter;
    const items = await this.prisma.orderDispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  async getDisputeDetail(id: string) {
    const dispute = await this.prisma.orderDispute.findUnique({
      where: { id },
      include: { order: { select: { id: true, status: true, totalAmount: true, buyerId: true, sellerId: true } } },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
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
    const chart7d: { date: string; orders: number; commission: number }[] = [];
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

  async listAudit(query: Record<string, string>) {
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
    const userIds = [...new Set(result.map((a) => a.userId).filter(Boolean))] as string[];
    const users =
      userIds.length > 0
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

  async listUsers(query: Record<string, string>) {
    const limit = Math.min(parseInt(query.limit ?? '20', 10) || 20, 100);
    const cursor = query.cursor ?? undefined;
    const q = query.q?.trim();
    const where = q
      ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { displayName: { contains: q, mode: 'insensitive' as const } }] }
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

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, displayName: true, email: true, phone: true, role: true, status: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
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
    const [activeHubs, inactiveHubs, activeRoutes] = await Promise.all([
      this.prisma.hub.count({ where: { isActive: true } }),
      this.prisma.hub.count({ where: { isActive: false } }),
      this.prisma.taxiRoute.count({ where: { status: 'ACTIVE' } }),
    ]);
    const allHubs = await this.prisma.hub.findMany({ select: { id: true, normalizedName: true, isActive: true } });
    const nameCount = new Map<string, number>();
    allHubs.forEach((h) => {
      const n = h.normalizedName || h.id;
      nameCount.set(n, (nameCount.get(n) ?? 0) + 1);
    });
    const duplicateHubsCount = Array.from(nameCount.values()).filter((c) => c > 1).reduce((s, c) => s + c, 0);

    const allRoutes = await this.prisma.taxiRoute.findMany({ select: { id: true, fromHubId: true, toHubId: true, routeType: true } });
    const routeKey = new Map<string, number>();
    allRoutes.forEach((r) => {
      const k = `${r.fromHubId}:${r.toHubId}:${r.routeType}`;
      routeKey.set(k, (routeKey.get(k) ?? 0) + 1);
    });
    const duplicateRoutesCount = Array.from(routeKey.values()).filter((c) => c > 1).reduce((s, c) => s + c, 0);

    const activeHubIds = new Set(allHubs.filter((h) => h.isActive).map((h) => h.id));
    const orphanRoutes = allRoutes.filter((r) => !activeHubIds.has(r.fromHubId) && !activeHubIds.has(r.toHubId)).length;
    const routeWithInactiveHub = allRoutes.filter((r) => !activeHubIds.has(r.fromHubId) || !activeHubIds.has(r.toHubId)).length;

    return { activeHubs, inactiveHubs, duplicateHubsCount, activeRoutes, duplicateRoutesCount, orphanRoutes, routeWithInactiveHub };
  }

  async getInfraOrphans() {
    const activeHubIds = (await this.prisma.hub.findMany({ where: { isActive: true }, select: { id: true } })).map((h) => h.id);
    const activeSet = new Set(activeHubIds);
    const routes = await this.prisma.taxiRoute.findMany({
      include: { fromHub: { select: { id: true, name: true, isActive: true } }, toHub: { select: { id: true, name: true, isActive: true } } },
    });
    return routes
      .filter((r) => !activeSet.has(r.fromHubId) || !activeSet.has(r.toHubId))
      .map((r) => ({ routeId: r.id, fromHub: r.fromHub, toHub: r.toHub, reason: !activeSet.has(r.fromHubId) ? 'fromHub inactive' : 'toHub inactive' }));
  }

  async listHubs() {
    const hubs = await this.prisma.hub.findMany({ orderBy: { createdAt: 'desc' } });
    const routeCounts = await this.prisma.taxiRoute.groupBy({ by: ['fromHubId'], _count: true, where: { status: 'ACTIVE' } });
    const routeMap = new Map(routeCounts.map((r) => [r.fromHubId, r._count]));

    const nameGroups = new Map<string, string[]>();
    hubs.forEach((h) => {
      const n = h.normalizedName || h.name.toLowerCase().trim();
      if (!nameGroups.has(n)) nameGroups.set(n, []);
      nameGroups.get(n)!.push(h.id);
    });
    const duplicateMap = new Map<string, string>();
    nameGroups.forEach((ids, name) => {
      if (ids.length > 1) ids.forEach((id) => duplicateMap.set(id, name));
    });

    return hubs.map((h) => ({
      ...h,
      activeRouteCount: routeMap.get(h.id) ?? 0,
      isDuplicate: duplicateMap.has(h.id),
      duplicateGroupId: duplicateMap.get(h.id) ?? null,
    }));
  }

  async listRoutes() {
    return this.prisma.taxiRoute.findMany({
      orderBy: { createdAt: 'desc' },
      include: { fromHub: { select: { id: true, name: true } }, toHub: { select: { id: true, name: true } } },
    });
  }

  async listCommissionConfig() {
    return this.prisma.commissionConfig.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async listCommissionLedger(query?: Record<string, string>) {
    const limit = Math.min(parseInt(query?.limit ?? '20', 10) || 20, 100);
    const items = await this.prisma.commissionRecord.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { id: true, totalAmount: true, status: true, buyerId: true, sellerId: true } } },
    });
    return { items };
  }

  async listCommissionAnomalies() {
    const records = await this.prisma.commissionRecord.findMany({
      where: { OR: [{ productRateApplied: { gt: 0.15 } }, { deliveryRateApplied: { gt: 0.15 } }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { order: { select: { id: true, totalAmount: true } } },
    });
    return { items: records };
  }

  async listJarmenkeEvents() {
    return this.prisma.jarmenkeEvent.findMany({ orderBy: { startAt: 'desc' } });
  }

  async listAccessList() {
    return this.prisma.accessListEntry.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async listFraudSignals(query?: Record<string, string>) {
    const statusFilter = query?.status?.trim();
    const where = statusFilter ? { status: statusFilter as any } : {};
    return this.prisma.fraudSignal.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async listRateLimits() {
    return this.prisma.rateLimitPolicy.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async cancelOrder(orderId: string, userId: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await this.prisma.deliveryRequest.updateMany({
        where: { orderId },
        data: { status: DeliveryRequestStatus.CANCELLED },
      });
      await this.audit(userId, 'admin.order.cancel', orderId, reason);
    }
    return { ok: true };
  }

  async reassignLeg(legId: string, userId: string | undefined, driverId: string, reason: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) throw new NotFoundException('Leg not found');
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    await this.prisma.deliveryLeg.update({
      where: { id: legId },
      data: { driverId },
    });
    await this.audit(userId, 'admin.delivery.leg.reassign', legId, reason, { driverId, orderId: leg.orderId });
    return { ok: true };
  }

  async unlockMainline(legId: string, userId: string | undefined, reason: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) throw new NotFoundException('Leg not found');
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    await this.prisma.deliveryLeg.update({
      where: { id: legId },
      data: { status: DeliveryLegStatus.OFFERING, driverId: null },
    });
    await this.audit(userId, 'admin.delivery.leg.unlock', legId, reason, { orderId: leg.orderId });
    return { ok: true };
  }

  async forceOrderStatus(orderId: string, userId: string | undefined, status: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(status as any)) throw new BadRequestException(`Invalid status. Valid: ${validStatuses.join(', ')}`);
    await this.prisma.order.update({ where: { id: orderId }, data: { status: status as OrderStatus } });
    await this.audit(userId, 'admin.order.force-status', orderId, reason, { from: order.status, to: status });
    return { ok: true, from: order.status, to: status };
  }

  async openDispute(orderId: string, userId: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const dispute = await this.prisma.orderDispute.create({
      data: { orderId, reason, openedByUserId: userId ?? null },
    });
    await this.audit(userId, 'admin.order.dispute.open', orderId, reason, { disputeId: dispute.id });
    return { ok: true, disputeId: dispute.id };
  }

  async resolveDispute(orderId: string, userId: string | undefined, resolution: string, resolutionNote: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const dispute = await this.prisma.orderDispute.findFirst({ where: { orderId, status: 'OPEN' } });
    if (!dispute) throw new NotFoundException('No open dispute for this order');
    await this.prisma.orderDispute.update({
      where: { id: dispute.id },
      data: { status: DisputeStatus.CLOSED, resolution: resolution as any, resolutionNote: resolutionNote ?? null, closedByUserId: userId ?? null, closedAt: new Date() },
    });
    await this.audit(userId, 'admin.order.dispute.resolve', orderId, reason, { disputeId: dispute.id, resolution });
    return { ok: true, disputeId: dispute.id, resolution };
  }

  async flagRefund(orderId: string, userId: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const flag = await this.prisma.refundFlag.create({
      data: { orderId, reason, createdByUserId: userId ?? null },
    });
    await this.audit(userId, 'admin.order.refund-flag', orderId, reason, { refundFlagId: flag.id });
    return { ok: true, refundFlagId: flag.id };
  }

  async forceCompleteLeg(legId: string, userId: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) throw new NotFoundException('Leg not found');
    await this.prisma.deliveryLeg.update({
      where: { id: legId },
      data: { status: DeliveryLegStatus.COMPLETED, completedAt: new Date() },
    });
    const eventKey = `admin:force-complete:${leg.orderId}:${legId}`;
    await this.prisma.proofEvent.upsert({
      where: { eventKey },
      create: { eventKey, eventType: 'LEG_COMPLETED' as any, entityType: 'LEG' as any, entityId: legId, actorUserId: userId, orderId: leg.orderId, legId, metaJson: { adminForce: true, reason } },
      update: {},
    });
    await this.audit(userId, 'admin.delivery.leg.force-complete', legId, reason, { orderId: leg.orderId });
    return { ok: true };
  }

  async attachLegProof(legId: string, userId: string | undefined, eventType: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) throw new NotFoundException('Leg not found');
    const eventKey = `admin:proof:${leg.orderId}:${legId}:${eventType}`;
    const proof = await this.prisma.proofEvent.upsert({
      where: { eventKey },
      create: { eventKey, eventType: eventType as any, entityType: 'LEG' as any, entityId: legId, actorUserId: userId, orderId: leg.orderId, legId, metaJson: { adminAttach: true, reason } },
      update: {},
    });
    await this.audit(userId, 'admin.delivery.leg.proof', legId, reason, { orderId: leg.orderId, eventType, proofId: proof.id });
    return { ok: true, proofEventId: proof.id };
  }

  async adjustLegGeo(legId: string, userId: string | undefined, arrivedLat: number, arrivedLng: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) throw new NotFoundException('Leg not found');
    await this.prisma.deliveryLeg.update({
      where: { id: legId },
      data: { arrivedLat, arrivedLng },
    });
    await this.audit(userId, 'admin.delivery.leg.adjust-geo', legId, reason, { orderId: leg.orderId, arrivedLat, arrivedLng });
    return { ok: true };
  }

  async createSla(userId: string | undefined, legSortOrder: number, minutes: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const sla = await this.prisma.deliverySlaConfig.create({
      data: { legSortOrder, minutes, createdByUserId: userId },
    });
    await this.audit(userId, 'admin.sla.create', sla.id, reason, { legSortOrder, minutes });
    return sla;
  }

  async updateSla(id: string, userId: string | undefined, legSortOrder: number, minutes: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const sla = await this.prisma.deliverySlaConfig.findUnique({ where: { id } });
    if (!sla) throw new NotFoundException('SLA not found');
    const updated = await this.prisma.deliverySlaConfig.update({
      where: { id },
      data: { legSortOrder, minutes },
    });
    await this.audit(userId, 'admin.sla.update', id, reason, { legSortOrder, minutes });
    return updated;
  }

  async createAlert(userId: string | undefined, key: string, threshold: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const alert = await this.prisma.alertConfig.create({
      data: { key, threshold, createdByUserId: userId },
    });
    await this.audit(userId, 'admin.alert.create', alert.id, reason, { key, threshold });
    return alert;
  }

  async updateAlert(id: string, userId: string | undefined, key: string, threshold: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const alert = await this.prisma.alertConfig.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    const updated = await this.prisma.alertConfig.update({ where: { id }, data: { key, threshold } });
    await this.audit(userId, 'admin.alert.update', id, reason, { key, threshold });
    return updated;
  }

  async createPlaybook(userId: string | undefined, key: string, title: string, stepsMarkdown: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const playbook = await this.prisma.incidentPlaybook.create({
      data: { key, title, stepsMarkdown, createdByUserId: userId },
    });
    await this.audit(userId, 'admin.playbook.create', playbook.id, reason, { key, title });
    return playbook;
  }

  async updatePlaybook(id: string, userId: string | undefined, key: string, title: string, stepsMarkdown: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const pb = await this.prisma.incidentPlaybook.findUnique({ where: { id } });
    if (!pb) throw new NotFoundException('Playbook not found');
    const updated = await this.prisma.incidentPlaybook.update({ where: { id }, data: { key, title, stepsMarkdown } });
    await this.audit(userId, 'admin.playbook.update', id, reason, { key, title });
    return updated;
  }

  async adminCreateHub(userId: string | undefined, name: string, lat: number, lng: number, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const normalizedName = name.toLowerCase().trim().replace(/\s+/g, ' ');
    const hub = await this.prisma.hub.create({
      data: { name, normalizedName, lat, lng },
    });
    await this.audit(userId, 'admin.hub.create', hub.id, reason, { name, lat, lng });
    return hub;
  }

  async adminCreateRoute(userId: string | undefined, fromHubId: string, toHubId: string, routeType: string, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const route = await this.prisma.taxiRoute.create({
      data: { fromHubId, toHubId, routeType: routeType as any, status: 'ACTIVE' },
    });
    await this.audit(userId, 'admin.route.create', route.id, reason, { fromHubId, toHubId, routeType });
    return route;
  }

  async createCommissionConfig(userId: string | undefined, body: Record<string, unknown>, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const config = await this.prisma.commissionConfig.create({
      data: {
        scope: (body.scope as any) ?? 'GLOBAL',
        regionId: body.regionId as string ?? null,
        category: body.category as string ?? null,
        productRatePercent: Number(body.productRatePercent) || 0.03,
        deliveryRatePercent: Number(body.deliveryRatePercent) || 0.03,
        effectiveFrom: new Date(body.effectiveFrom as string || Date.now()),
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo as string) : null,
        createdByUserId: userId,
      },
    });
    await this.audit(userId, 'admin.commission.config.create', config.id, reason as string);
    return config;
  }

  async adminCreateJarmenkeEvent(userId: string | undefined, body: Record<string, unknown>, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const event = await this.prisma.jarmenkeEvent.create({
      data: {
        startAt: new Date(body.startAt as string),
        endAt: new Date(body.endAt as string),
        productRateOverridePercent: body.productRateOverridePercent ? Number(body.productRateOverridePercent) : null,
        deliveryRateOverridePercent: body.deliveryRateOverridePercent ? Number(body.deliveryRateOverridePercent) : null,
      },
    });
    await this.audit(userId, 'admin.jarmenke.event.create', event.id, reason as string);
    return event;
  }

  async createAccessListEntry(userId: string | undefined, body: Record<string, unknown>, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const entry = await this.prisma.accessListEntry.create({
      data: {
        listType: (body.listType as any) ?? 'BLACKLIST',
        targetType: (body.targetType as any) ?? 'USER_ID',
        targetValue: body.targetValue as string,
        reason: reason,
        createdByUserId: userId,
      },
    });
    await this.audit(userId, 'admin.access-list.create', entry.id, reason as string);
    return entry;
  }

  async removeAccessListEntry(id: string, userId: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const entry = await this.prisma.accessListEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Access list entry not found');
    await this.prisma.accessListEntry.delete({ where: { id } });
    await this.audit(userId, 'admin.access-list.remove', id, reason);
    return { ok: true };
  }

  async createRateLimit(userId: string | undefined, body: Record<string, unknown>, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const policy = await this.prisma.rateLimitPolicy.create({
      data: {
        key: body.key as string,
        limit: Number(body.limit) || 100,
        windowSeconds: Number(body.windowSeconds) || 60,
        createdByUserId: userId,
      },
    });
    await this.audit(userId, 'admin.rate-limit.create', policy.id, reason as string);
    return policy;
  }

  async resolveFraudSignal(id: string, userId: string | undefined, body: Record<string, unknown>, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('reason is required');
    const signal = await this.prisma.fraudSignal.findUnique({ where: { id } });
    if (!signal) throw new NotFoundException('Fraud signal not found');
    const resolution = body.resolution as string ?? 'RESOLVED';
    await this.prisma.fraudSignal.update({
      where: { id },
      data: { status: resolution === 'DISMISSED' ? FraudSignalStatus.DISMISSED : FraudSignalStatus.RESOLVED },
    });
    await this.audit(userId, 'admin.fraud.signal.resolve', id, reason as string, { resolution });
    return { ok: true, resolution };
  }

  async exportStatsCSV() {
    const stats = await this.getStats();
    const header = 'date,orders,commission\n';
    const rows = stats.chart7d.map((d) => `${d.date},${d.orders},${d.commission}`).join('\n');
    return header + rows + '\n';
  }

  async exportCommissionCSV() {
    const records = await this.prisma.commissionRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: { order: { select: { id: true, totalAmount: true } } },
    });
    const header = 'orderId,productRate,deliveryRate,productAmount,deliveryAmount,total,source,createdAt\n';
    const rows = records.map((r) =>
      `${r.orderId},${r.productRateApplied},${r.deliveryRateApplied},${r.productCommissionAmount},${r.deliveryCommissionAmount},${r.productCommissionAmount + r.deliveryCommissionAmount},${r.source},${r.createdAt.toISOString()}`
    ).join('\n');
    return header + rows + '\n';
  }
}
