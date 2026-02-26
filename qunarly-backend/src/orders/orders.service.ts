import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  DeliveryLegStatus,
  DeliveryRequestStatus,
  LogisticsSourceType,
  OrderStatus,
  Prisma,
  ProductListingStatus,
  ShipmentJobStatus,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { JarmenkePricingService } from '../jarmenke/pricing.service';

type Coordinates = { lat?: number | null; lng?: number | null };
type PaymentIntentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
type PaymentProvider = 'KASPI_QR';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private static prismaExportsLogged = false;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private pricingService: JarmenkePricingService,
  ) {}

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    this.logPrismaExportsOnce();
    if (!dto.idempotencyKey?.trim()) {
      throw new BadRequestException('idempotencyKey is required');
    }
    if (!dto.listingId || !dto.quantity) {
      throw new BadRequestException('listingId and quantity are required');
    }
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { homeLat: true, homeLng: true, homeAddressText: true },
    });
    if (!buyer?.homeLat || !buyer?.homeLng || !buyer?.homeAddressText) {
      throw new BadRequestException('Home location is required');
    }
    const existing = await this.prisma.order.findFirst({
      where: { buyerId, idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return this.getOrder(existing.id, buyerId);
    }

    const listing = await this.prisma.productListing.findUnique({
      where: { id: dto.listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.status !== ProductListingStatus.PUBLISHED) {
      throw new BadRequestException('Listing is not active');
    }
    if (dto.quantity > listing.quantity) {
      throw new BadRequestException('Requested quantity exceeds available quantity');
    }
    if (!dto.destinationText?.trim()) {
      throw new BadRequestException('Destination is required');
    }

    const unitPrice = listing.price;
    const totalPrice = unitPrice * dto.quantity;

    let order;
    try {
      order = await this.prisma.order.create({
        data: {
          listingId: listing.id,
          sellerId: listing.sellerId,
          buyerId,
          idempotencyKey: dto.idempotencyKey,
          quantity: dto.quantity,
          unitPrice,
          totalPrice,
          status: OrderStatus.PLACED,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const found = await this.prisma.order.findFirst({
          where: { buyerId, idempotencyKey: dto.idempotencyKey },
        });
        if (found) {
          return this.getOrder(found.id, buyerId);
        }
      }
      throw error;
    }

    this.logDebug('order.create', {
      orderId: order.id,
      listingId: listing.id,
      quantity: dto.quantity,
      destinationText: dto.destinationText.trim(),
      destLat: dto.destLat ?? null,
      destLng: dto.destLng ?? null,
    });

    const originText = listing.addressText?.trim() || 'Жеткізу нүктесі';
    const originCoords = { lat: listing.lat, lng: listing.lng };
    const destinationCoords = { lat: dto.destLat, lng: dto.destLng };

    const request = await this.prisma.deliveryRequest.create({
      data: {
        orderId: order.id,
        originText,
        destinationText: dto.destinationText.trim(),
        originLat: originCoords.lat ?? undefined,
        originLng: originCoords.lng ?? undefined,
        destLat: destinationCoords.lat ?? undefined,
        destLng: destinationCoords.lng ?? undefined,
        distanceKm: this.calculateDistanceKm(originCoords, destinationCoords) ?? undefined,
        status: DeliveryRequestStatus.CREATED,
      },
    });
    const delivery = await this.prisma.delivery.create({
      data: {
        orderId: order.id,
        requestId: request.id,
      },
    });

    const relay = await this.buildRelayLegs({
      orderId: order.id,
      requestId: request.id,
      originText,
      destinationText: dto.destinationText.trim(),
      originCoords,
      destinationCoords,
    });
    const legs = relay.legs;
    const commissionConfig = await this.selectCommissionConfig(listing);
    const activeEvent = await this.prisma.jarmenkeEvent.findFirst({
      where: {
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
      orderBy: { startAt: 'desc' },
    });
    const baseRates = commissionConfig
      ? {
          productRate: commissionConfig.productRatePercent / 100,
          deliveryRate: commissionConfig.deliveryRatePercent / 100,
        }
      : null;
    const resolvedRates = this.pricingService.resolveCommissionRatesWithOverrides(baseRates, activeEvent ?? undefined);
    const commissionAmounts = this.pricingService.calculateCommissionAmounts(
      totalPrice,
      relay.totalFee,
      resolvedRates.productRate,
      resolvedRates.deliveryRate,
    );
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        payoutJson: { deliveryFee: relay.totalFee, hubId: relay.hubId, originIsHub: relay.originIsHub },
        productSubtotal: totalPrice,
        deliveryFee: relay.totalFee,
        totalAmount: totalPrice + relay.totalFee,
        destinationText: dto.destinationText.trim(),
        destLat: dto.destLat ?? null,
        destLng: dto.destLng ?? null,
      },
    });
    await this.prisma.commissionRecord.create({
      data: {
        orderId: order.id,
        productRateApplied: resolvedRates.productRate,
        deliveryRateApplied: resolvedRates.deliveryRate,
        productCommissionAmount: commissionAmounts.productCommissionAmount,
        deliveryCommissionAmount: commissionAmounts.deliveryCommissionAmount,
        source: resolvedRates.source,
      },
    });
    this.logDebug('delivery.legs.generated', {
      orderId: order.id,
      originText,
      destinationText: dto.destinationText.trim(),
      originIsHub: relay.originIsHub,
      hubId: relay.hubId,
      legCount: legs.length,
      fees: legs.map((leg) => leg.price),
    });

    if (legs.length) {
      await this.prisma.deliveryLeg.createMany({
        data: legs.map((leg) => ({
          ...leg,
          deliveryId: delivery.id,
          driverId: null,
        })),
      });
    }

    this.logDebug('logistics.legs.created', {
      orderId: order.id,
      legsCount: legs.length,
      statuses: legs.map((leg) => leg.status),
    });

    const availableLegsCount = await this.prisma.deliveryLeg.count({
      where: { status: DeliveryLegStatus.OFFERING, driverId: null },
    });
    this.logger.log(`order created: ${order.id}`);
    this.logger.log(`legs created: ${legs.length}`);
    this.logger.log(`available legs now: ${availableLegsCount}`);

    const carriers = await this.prisma.user.findMany({
      where: { role: 'CARRIER', status: 'ACTIVE' },
      select: { id: true },
    });

    await this.notificationsService.createForUsers([listing.sellerId], {
      type: 'MARKET_ORDER',
      title: 'Жаңа тапсырыс',
      body: `${listing.title} бойынша жаңа тапсырыс түсті.`,
      dataJson: { orderId: order.id, listingId: listing.id },
    });
    await this.notificationsService.createForUsers(
      carriers.map((user) => user.id),
      {
        type: 'NEW_DELIVERY_LEG',
        title: 'Жаңа жеткізу',
        body: `${listing.title} бойынша жаңа жеткізу кезеңі бар.`,
        dataJson: { orderId: order.id, listingId: listing.id },
      },
    );
    return this.getOrder(order.id, buyerId);
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
        delivery: true,
        legs: {
          orderBy: { sortOrder: 'asc' },
          include: { driver: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new BadRequestException('Order not accessible');
    }
    const currentLeg =
      order.legs.find(
        (leg) => !this.isLegClosed(leg.status),
      ) ?? null;
    return {
      ...order,
      currentLeg,
    };
  }

  private async selectCommissionConfig(listing: { regionId?: string | null; category?: string | null }) {
    const now = new Date();
    const configs = (await (this.prisma as any).commissionConfig.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
    })) as Array<{
      scope: string;
      regionId?: string | null;
      category?: string | null;
      productRatePercent: number;
      deliveryRatePercent: number;
    }>;
    if (!configs.length) return null;
    const categoryMatch = configs.find((config) => config.scope === 'CATEGORY' && config.category === listing.category);
    if (categoryMatch) return categoryMatch;
    const regionMatch = configs.find((config) => config.scope === 'REGION' && config.regionId === listing.regionId);
    if (regionMatch) return regionMatch;
    const globalMatch = configs.find((config) => config.scope === 'GLOBAL');
    return globalMatch ?? null;
  }

  async listMyOrders(userId: string, listingId?: string) {
    const where: any = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };
    if (listingId) {
      where.listingId = listingId;
    }
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: true,
        delivery: true,
        legs: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return orders.map((order) => ({
      ...order,
      currentLeg:
        order.legs.find(
          (leg) => !this.isLegClosed(leg.status),
        ) ?? null,
    }));
  }

  async confirmPayment(dto: {
    orderId: string;
    provider: PaymentProvider;
    externalRef: string;
    status: PaymentIntentStatus;
    idempotencyKey?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: dto.orderId },
        include: { listing: true },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      const previousStatus = order.status;
      let shipmentCreated = false;
      let shipmentJobId: string | null = null;

      if (dto.status === 'CONFIRMED') {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.IN_FULFILLMENT },
        });

        const delivery = await tx.delivery.findFirst({
          where: { orderId: order.id },
        });
        if (delivery?.shipmentId) {
          shipmentJobId = delivery.shipmentId;
        }
        const existingShipment = shipmentJobId
          ? await tx.shipmentJob.findUnique({ where: { id: shipmentJobId } })
          : await tx.shipmentJob.findUnique({
              where: { orderId: order.id } as unknown as Prisma.ShipmentJobWhereUniqueInput,
            });
        if (existingShipment) {
          shipmentJobId = existingShipment.id;
        } else {
          const request = await tx.deliveryRequest.findUnique({
            where: { orderId: order.id },
          });
          const originLat = request?.originLat ?? order.listing?.lat ?? 0;
          const originLng = request?.originLng ?? order.listing?.lng ?? 0;
          const destLat = request?.destLat ?? 0;
          const destLng = request?.destLng ?? 0;
          const created = await tx.shipmentJob.create({
            data: {
              requesterId: order.sellerId,
              orderId: order.id,
              originLat,
              originLng,
              destLat,
              destLng,
              originAddressText: request?.originText ?? order.listing?.addressText ?? undefined,
              destAddressText: request?.destinationText ?? undefined,
              cargoJson: {
                orderId: order.id,
                listingId: order.listingId,
                quantity: order.quantity,
              },
              status: ShipmentJobStatus.CREATED,
              sourceType: LogisticsSourceType.ORDER,
              sourceId: order.id,
            } as Prisma.ShipmentJobUncheckedCreateInput,
          });
          shipmentCreated = true;
          shipmentJobId = created.id;

          if (delivery && !delivery.shipmentId) {
            await tx.delivery.update({
              where: { id: delivery.id },
              data: { shipmentId: created.id },
            });
          }
        }
      }

      if (dto.status === 'FAILED' || dto.status === 'EXPIRED') {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED },
        });
      }

      const updated = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      this.logDebug('order.confirmPayment', {
        orderId: order.id,
        previousStatus,
        nextStatus: updated?.status ?? null,
        paymentStatus: dto.status,
        provider: dto.provider,
        externalRef: dto.externalRef,
        shipmentCreated,
        shipmentJobId,
      });
      return { ok: true, orderId: order.id, shipmentJobId };
    });
  }

  private logPrismaExportsOnce() {
    if (OrdersService.prismaExportsLogged) return;
    if (process.env.PRISMA_DEBUG !== 'true') return;
    OrdersService.prismaExportsLogged = true;
    const keys = Object.keys(Prisma).sort();
    this.logger.debug(`Prisma exports: ${keys.join(', ')}`);
  }

  private logDebug(event: string, payload: Record<string, unknown>) {
    if (process.env.LOG_LEVEL !== 'debug') return;
    this.logger.debug(`${event} ${JSON.stringify(payload)}`);
  }


  private calculateDistanceKm(origin: Coordinates, destination: Coordinates) {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return null;
    }
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(destination.lat - origin.lat);
    const dLng = toRad(destination.lng - origin.lng);
    const lat1 = toRad(origin.lat);
    const lat2 = toRad(destination.lat);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  private isLegClosed(status: DeliveryLegStatus) {
    return status === DeliveryLegStatus.COMPLETED;
  }

  private calculateLegCount(distanceKm: number | null) {
    if (!distanceKm) {
      return 1;
    }
    if (distanceKm > 300) {
      return 3;
    }
    if (distanceKm > 80) {
      return 2;
    }
    return 1;
  }

  private calculatePayouts(totalPrice: number, legsCount: number) {
    const platformFee = Number((totalPrice * 0.05).toFixed(2));
    const driverPool = Number((totalPrice * 0.1).toFixed(2));
    const sellerAmount = Number((totalPrice - platformFee - driverPool).toFixed(2));
    const driverPerLeg = Number((driverPool / Math.max(legsCount, 1)).toFixed(2));
    return {
      totalPrice,
      platformFee,
      driverPool,
      sellerAmount,
      driverPerLeg,
    };
  }

  private buildLegs(params: {
    orderId: string;
    requestId: string;
    originText: string;
    destinationText: string;
    originCoords: Coordinates;
    destinationCoords: Coordinates;
    legsCount: number;
    perLegPrice: number;
  }) {
    const { orderId, requestId, originText, destinationText, originCoords, destinationCoords, legsCount, perLegPrice } =
      params;
    const legs: Array<{
      orderId: string;
      requestId: string;
      fromLocation: string;
      toLocation: string;
      fromLat?: number;
      fromLng?: number;
      toLat?: number;
      toLng?: number;
      price: number;
      status: DeliveryLegStatus;
      sortOrder: number;
    }> = [];

    if (legsCount === 1) {
      legs.push({
        orderId,
        requestId,
        fromLocation: originText,
        toLocation: destinationText,
        fromLat: originCoords.lat ?? undefined,
        fromLng: originCoords.lng ?? undefined,
        toLat: destinationCoords.lat ?? undefined,
        toLng: destinationCoords.lng ?? undefined,
        price: perLegPrice,
        status: DeliveryLegStatus.OFFERING,
        sortOrder: 1,
      });
      return legs;
    }

    const mid1 = this.interpolate(originCoords, destinationCoords, legsCount === 2 ? 0.5 : 1 / 3);
    const mid2 = legsCount === 3 ? this.interpolate(originCoords, destinationCoords, 2 / 3) : null;

    if (legsCount === 2) {
      legs.push({
        orderId,
        requestId,
        fromLocation: originText,
        toLocation: 'Аудан/Қала хаб',
        fromLat: originCoords.lat ?? undefined,
        fromLng: originCoords.lng ?? undefined,
        toLat: mid1?.lat ?? undefined,
        toLng: mid1?.lng ?? undefined,
        price: perLegPrice,
        status: DeliveryLegStatus.OFFERING,
        sortOrder: 1,
      });
      legs.push({
        orderId,
        requestId,
        fromLocation: 'Аудан/Қала хаб',
        toLocation: destinationText,
        fromLat: mid1?.lat ?? undefined,
        fromLng: mid1?.lng ?? undefined,
        toLat: destinationCoords.lat ?? undefined,
        toLng: destinationCoords.lng ?? undefined,
        price: perLegPrice,
        status: DeliveryLegStatus.OFFERING,
        sortOrder: 2,
      });
      return legs;
    }

    legs.push({
      orderId,
      requestId,
      fromLocation: originText,
      toLocation: 'Аудан хаб',
      fromLat: originCoords.lat ?? undefined,
      fromLng: originCoords.lng ?? undefined,
      toLat: mid1?.lat ?? undefined,
      toLng: mid1?.lng ?? undefined,
      price: perLegPrice,
      status: DeliveryLegStatus.OFFERING,
      sortOrder: 1,
    });
    legs.push({
      orderId,
      requestId,
      fromLocation: 'Аудан хаб',
      toLocation: 'Қала хаб',
      fromLat: mid1?.lat ?? undefined,
      fromLng: mid1?.lng ?? undefined,
      toLat: mid2?.lat ?? undefined,
      toLng: mid2?.lng ?? undefined,
      price: perLegPrice,
      status: DeliveryLegStatus.OFFERING,
      sortOrder: 2,
    });
    legs.push({
      orderId,
      requestId,
      fromLocation: 'Қала хаб',
      toLocation: destinationText,
      fromLat: mid2?.lat ?? undefined,
      fromLng: mid2?.lng ?? undefined,
      toLat: destinationCoords.lat ?? undefined,
      toLng: destinationCoords.lng ?? undefined,
      price: perLegPrice,
      status: DeliveryLegStatus.OFFERING,
      sortOrder: 3,
    });
    return legs;
  }

  private async buildRelayLegs(params: {
    orderId: string;
    requestId: string;
    originText: string;
    destinationText: string;
    originCoords: Coordinates;
    destinationCoords: Coordinates;
  }) {
    const { orderId, requestId, originText, destinationText, originCoords, destinationCoords } = params;
    const hubResult = await this.resolveHubForOrigin(originCoords);
    const hub = hubResult?.hub ?? null;
    const originIsHub = hubResult?.originIsHub ?? false;
    const legs: Array<{
      orderId: string;
      requestId: string;
      fromLocation: string;
      toLocation: string;
      fromLat?: number;
      fromLng?: number;
      toLat?: number;
      toLng?: number;
      price: number;
      status: DeliveryLegStatus;
      sortOrder: number;
      fromHubId?: string;
      toHubId?: string;
    }> = [];

    if (originIsHub && hub) {
      legs.push({
        orderId,
        requestId,
        fromLocation: hub.name,
        toLocation: destinationText,
        fromLat: hub.lat,
        fromLng: hub.lng,
        toLat: destinationCoords.lat ?? undefined,
        toLng: destinationCoords.lng ?? undefined,
        price: 1250,
        status: DeliveryLegStatus.OFFERING,
        sortOrder: 1,
        fromHubId: hub.id,
      });
      return { legs, totalFee: 1250, hubId: hub.id, originIsHub };
    }

    if (!hub) {
      legs.push({
        orderId,
        requestId,
        fromLocation: originText,
        toLocation: destinationText,
        fromLat: originCoords.lat ?? undefined,
        fromLng: originCoords.lng ?? undefined,
        toLat: destinationCoords.lat ?? undefined,
        toLng: destinationCoords.lng ?? undefined,
        price: 1250,
        status: DeliveryLegStatus.OFFERING,
        sortOrder: 1,
      });
      return { legs, totalFee: 1250, hubId: null, originIsHub: false };
    }

    legs.push({
      orderId,
      requestId,
      fromLocation: originText,
      toLocation: hub.name,
      fromLat: originCoords.lat ?? undefined,
      fromLng: originCoords.lng ?? undefined,
      toLat: hub.lat ?? undefined,
      toLng: hub.lng ?? undefined,
      price: 250,
      status: DeliveryLegStatus.OFFERING,
      sortOrder: 1,
      toHubId: hub.id,
    });
    legs.push({
      orderId,
      requestId,
      fromLocation: hub.name,
      toLocation: destinationText,
      fromLat: hub.lat ?? undefined,
      fromLng: hub.lng ?? undefined,
      toLat: destinationCoords.lat ?? undefined,
      toLng: destinationCoords.lng ?? undefined,
      price: 1250,
      status: DeliveryLegStatus.ACCEPTED,
      sortOrder: 2,
      fromHubId: hub.id,
    });
    return { legs, totalFee: 1500, hubId: hub.id, originIsHub: false };
  }

  private async resolveHubForOrigin(originCoords: Coordinates) {
    if (typeof originCoords.lat !== 'number' || typeof originCoords.lng !== 'number') {
      return null;
    }
    const hubs = await this.prisma.hub.findMany({
      where: {
        isActive: true,
        taxiRoutesFrom: {
          some: {
            routeType: { in: ['DISTRICT_TO_CITY', 'VILLAGE_TO_CITY'] },
            status: 'ACTIVE',
          },
        },
      },
      include: { taxiRoutesFrom: true },
    });
    if (!hubs.length) {
      const fallback = await this.prisma.hub.findFirst({ where: { isActive: true } });
      if (!fallback) return null;
      const distanceKm = this.calculateDistanceKm(
        { lat: originCoords.lat, lng: originCoords.lng },
        { lat: fallback.lat, lng: fallback.lng },
      );
      const fallbackRadiusKm = (fallback as any).radiusKm ?? (((fallback as any).radiusMeters ?? 800) / 1000);
      const originIsHub = distanceKm ? distanceKm <= fallbackRadiusKm : false;
      return { hub: fallback, originIsHub };
    }
    const withDistance = hubs.map((hub) => ({
      hub,
      distanceKm:
        this.calculateDistanceKm(
          { lat: originCoords.lat, lng: originCoords.lng },
          { lat: hub.lat, lng: hub.lng },
        ) ?? Infinity,
      routePriority: Math.max(0, ...hub.taxiRoutesFrom.map((route: any) => route.priority ?? 0)),
    }));
    withDistance.sort((a, b) => {
      if (b.routePriority !== a.routePriority) return b.routePriority - a.routePriority;
      return a.distanceKm - b.distanceKm;
    });
    const nearest = withDistance[0];
    const nearestRadiusKm = (nearest.hub as any).radiusKm ?? (((nearest.hub as any).radiusMeters ?? 800) / 1000);
    const originIsHub = nearest.distanceKm <= nearestRadiusKm;
    return { hub: nearest.hub, originIsHub };
  }

  private interpolate(origin: Coordinates, destination: Coordinates, ratio: number) {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return null;
    }
    return {
      lat: origin.lat + (destination.lat - origin.lat) * ratio,
      lng: origin.lng + (destination.lng - origin.lng) * ratio,
    };
  }
}
