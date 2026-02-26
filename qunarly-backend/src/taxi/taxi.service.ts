import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { EnsureRouteDto } from './dto/ensure-route.dto';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TTL_SEC } from './taxi.constants';

const OFFER_TTL_SECONDS = 45; // CALLED_TIMEOUT_SEC

@Injectable()
export class TaxiService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async listRoutes(
    fromHubId?: string,
    toHubId?: string,
    mode: 'passenger' | 'driver' = 'passenger',
  ) {
    const statusFilter =
      mode === 'driver'
        ? { in: ['ACTIVE', 'INACTIVE', 'PAUSED'] as const }
        : { equals: 'ACTIVE' as const };
    return this.prisma.taxiRoute.findMany({
      where: {
        status: statusFilter as any,
        ...(fromHubId ? { fromHubId } : {}),
        ...(toHubId ? { toHubId } : {}),
      },
      include: {
        fromHub: true,
        toHub: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRoute(dto: CreateRouteDto) {
    if (dto.fromHubId === dto.toHubId) {
      throw new BadRequestException('Route endpoints must be different');
    }
    return this.prisma.$transaction(async (tx) => {
      try {
        const pairId = randomUUID();
        const created = await tx.taxiRoute.create({
          data: {
            fromHubId: dto.fromHubId,
            toHubId: dto.toHubId,
            routeType: dto.routeType,
            status: 'ACTIVE',
            autoCreated: false,
            pairId,
            createdByUserId: undefined,
          },
          include: { fromHub: true, toHub: true },
        });
        const reverse = await tx.taxiRoute.findUnique({
          where: {
            fromHubId_toHubId_routeType: {
              fromHubId: dto.toHubId,
              toHubId: dto.fromHubId,
              routeType: dto.routeType,
            },
          },
        });
        if (reverse) {
          if (!reverse.pairId) {
            await tx.taxiRoute.update({
              where: { id: reverse.id },
              data: { pairId },
            });
          }
        } else {
          try {
            await tx.taxiRoute.create({
              data: {
                fromHubId: dto.toHubId,
                toHubId: dto.fromHubId,
                routeType: dto.routeType,
                status: 'INACTIVE',
                autoCreated: true,
                pairId,
                createdByUserId: undefined,
              },
            });
          } catch (error) {
            if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
              throw error;
            }
          }
        }
        return created;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new BadRequestException('Route already exists');
        }
        throw error;
      }
    });
  }

  async ensureRoute(userId: string, dto: EnsureRouteDto) {
    const routeType = dto.routeType || 'VILLAGE_TO_DISTRICT';
    if (dto.originHubId === dto.destHubId) {
      throw new BadRequestException('Route endpoints must be different');
    }
    const existing = await this.prisma.taxiRoute.findUnique({
      where: {
        fromHubId_toHubId_routeType: {
          fromHubId: dto.originHubId,
          toHubId: dto.destHubId,
          routeType,
        },
      },
      include: { fromHub: true, toHub: true },
    });
    if (existing) {
      return existing;
    }
    try {
      const created = await this.prisma.taxiRoute.create({
        data: {
          fromHubId: dto.originHubId,
          toHubId: dto.destHubId,
          routeType,
          status: 'ACTIVE',
          autoCreated: false,
          pairId: randomUUID(),
          createdByUserId: userId,
        },
        include: { fromHub: true, toHub: true },
      });
      try {
        await this.prisma.taxiRoute.create({
          data: {
            fromHubId: dto.destHubId,
            toHubId: dto.originHubId,
            routeType,
            status: 'INACTIVE',
            autoCreated: true,
            pairId: created.pairId,
          },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
          throw error;
        }
      }
      return created;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.taxiRoute.findUnique({
          where: {
            fromHubId_toHubId_routeType: {
              fromHubId: dto.originHubId,
              toHubId: dto.destHubId,
              routeType,
            },
          },
          include: { fromHub: true, toHub: true },
        });
      }
      throw error;
    }
  }

  async getQueueStatus(driverId: string, routeId: string) {
    const queue = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId } },
    });
    const passengerCount = await this.prisma.rideRequest.count({
      where: { routeId, status: { in: ['PENDING', 'OFFER_SENT'] } },
    });
    if (queue?.status === 'REMOVED_INACTIVE') {
      return { queue: null, passengerCount };
    }
    return { queue, passengerCount };
  }

  async listPendingOffers(driverId: string) {
    const now = new Date();
    const expiredOffers = await this.prisma.driverOffer.findMany({
      where: {
        driverId,
        status: 'PENDING',
        expiresAt: { lt: now },
      },
      select: { id: true, requestId: true },
    });
    if (expiredOffers.length) {
      const expiredOfferIds = expiredOffers.map((offer) => offer.id);
      const expiredRequestIds = expiredOffers.map((offer) => offer.requestId);
      await this.prisma.driverOffer.updateMany({
        where: { id: { in: expiredOfferIds } },
        data: { status: 'EXPIRED' },
      });
      await this.prisma.rideRequest.updateMany({
        where: { id: { in: expiredRequestIds }, status: 'OFFER_SENT', currentOfferId: { in: expiredOfferIds } },
        data: { status: 'PENDING', currentOfferId: null },
      });
      for (const requestId of expiredRequestIds) {
        await this.dispatchOffer(requestId);
      }
    }
    return this.prisma.driverOffer.findMany({
      where: { driverId, status: 'PENDING', request: { status: { in: ['PENDING', 'OFFER_SENT'] } } },
      include: {
        request: {
          include: {
            passenger: {
              select: {
                id: true,
                phone: true,
                displayName: true,
              },
            },
          },
        },
        route: { include: { fromHub: true, toHub: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listQueueDrivers(routeId: string) {
    const now = new Date();
    const queues = await this.prisma.driverQueue.findMany({
      where: {
        routeId,
        status: { in: ['IN_QUEUE', 'OFFERED'] },
        expiresAt: { not: null, gt: now },
      },
      orderBy: { joinedAt: 'asc' },
      include: {
        driver: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    return queues.map((q) => ({
      driverId: q.driverId,
      displayName: q.driver?.displayName ?? 'Жүргізуші',
      phone: q.driver?.phone ?? null,
      avatarUrl: q.driver?.avatarUrl ?? null,
      status: q.status,
      availableSeats: q.availableSeats,
      capacity: q.capacity,
      joinedAt: q.joinedAt,
    }));
  }

  async listQueuePassengers(driverId: string, routeId: string, expireMinutes = 15) {
    const queue = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId } },
    });
    if (!queue) {
      return [];
    }
    if (expireMinutes > 0) {
      await this.expireConfirmedRequests(routeId, expireMinutes);
    }
    const requests = await this.prisma.rideRequest.findMany({
      where: { routeId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        passenger: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
    return requests.map((request) => ({
      id: request.id,
      userId: request.passengerId,
      displayName: request.passenger?.displayName ?? 'Жолаушы',
      avatarUrl: request.passenger?.avatarUrl ?? null,
      seatsRequested: request.seats,
      pickupLabel: request.pickupText,
      departLabel: request.waitUntilFull
        ? 'Толғанда'
        : request.departureType === 'TOMORROW'
          ? 'Ертең'
          : 'Бүгін',
      status: request.status,
    }));
  }

  async markQueueOnTheWay(driverId: string, routeId: string) {
    const queue = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId } },
    });
    if (!queue) {
      throw new NotFoundException('Not in queue');
    }
    return this.prisma.driverQueue.update({
      where: { driverId_routeId: { driverId, routeId } },
      data: { status: 'ON_TRIP' },
    });
  }

  async markQueueInactive(driverId: string, routeId: string) {
    const queue = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId } },
    });
    if (!queue) {
      throw new NotFoundException('Not in queue');
    }
    return this.prisma.driverQueue.update({
      where: { driverId_routeId: { driverId, routeId } },
      data: { status: 'REMOVED_INACTIVE', availableSeats: 0 },
    });
  }

  async confirmQueuePassenger(driverId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!request || request.status !== 'PENDING') {
        throw new NotFoundException('Request not available');
      }
      await this.ensureSeatsAvailable(tx, driverId, request.routeId, request.seats);
      await tx.rideRequest.update({
        where: { id: requestId },
        data: { status: 'MATCHED', assignedDriverId: driverId },
      });
      await this.syncQueueSeats(tx, driverId, request.routeId);
      return { ok: true };
    });
  }

  async skipQueuePassenger(driverId: string, requestId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== 'PENDING') {
      throw new NotFoundException('Request not available');
    }
    const queue = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId: request.routeId } },
    });
    if (!queue) {
      throw new BadRequestException('Not in queue');
    }
    return this.prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'REMOVED_BY_DRIVER' },
    });
  }

  async removeConfirmedPassenger(
    driverId: string,
    requestId: string,
    reason: 'REMOVED_BY_DRIVER' | 'NO_SHOW',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!request || !['MATCHED', 'CONFIRMED', 'DRIVER_EN_ROUTE'].includes(request.status)) {
        throw new NotFoundException('Request not available');
      }
      if (request.assignedDriverId !== driverId) {
        throw new BadRequestException('Not allowed');
      }
      await tx.rideRequest.update({
        where: { id: requestId },
        data: { status: reason },
      });
      await this.syncQueueSeats(tx, driverId, request.routeId);
      return { ok: true };
    });
  }

  async joinQueue(driverId: string, dto: JoinQueueDto) {
    const route = await this.prisma.taxiRoute.findUnique({ where: { id: dto.routeId } });
    if (!route || route.status === 'ARCHIVED') {
      throw new BadRequestException('Route not found');
    }
    const capacity = dto.capacity ?? 4;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_SEC * 1000);
    return this.prisma.$transaction(async (tx) => {
      await tx.driverQueue.updateMany({
        where: { driverId, routeId: { not: dto.routeId } },
        data: { status: 'REMOVED_INACTIVE', availableSeats: 0 },
      });
      const queue = await tx.driverQueue.upsert({
        where: { driverId_routeId: { driverId, routeId: dto.routeId } },
        update: {
          status: 'IN_QUEUE',
          capacity,
          availableSeats: capacity,
          joinedAt: now,
          expiresAt,
          lastPingAt: now,
          calledExpiresAt: null,
        },
        create: {
          driverId,
          routeId: dto.routeId,
          status: 'IN_QUEUE',
          capacity,
          availableSeats: capacity,
          joinedAt: now,
          expiresAt,
          lastPingAt: now,
        },
      });
      if (route.status === 'INACTIVE') {
        await tx.taxiRoute.update({
          where: { id: route.id },
          data: { status: 'ACTIVE' },
        });
      }
      await tx.queueEvent.create({
        data: { queueId: queue.id, eventType: 'JOIN', metaJson: {} },
      });
      return queue;
    });
  }

  async pingQueue(driverId: string, routeId: string) {
    const queue = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId } },
    });
    if (!queue) {
      throw new NotFoundException('Not in queue');
    }
    if (queue.status !== 'IN_QUEUE' && queue.status !== 'OFFERED') {
      throw new BadRequestException('Queue entry not active');
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_SEC * 1000);
    await this.prisma.driverQueue.update({
      where: { id: queue.id },
      data: { lastPingAt: now, expiresAt },
    });
    await this.logQueueEvent(this.prisma, queue.id, 'PING');
    return { ok: true, expiresAt };
  }

  private async logQueueEvent(
    client: Prisma.TransactionClient | PrismaService,
    queueId: string,
    eventType: string,
    meta?: object,
  ) {
    await (client as PrismaService).queueEvent.create({
      data: { queueId, eventType, metaJson: (meta ?? {}) as Prisma.InputJsonValue },
    });
  }

  @Cron('* * * * *')
  async expireQueueEntriesAndOffers() {
    const now = new Date();
    const expiredQueues = await this.prisma.driverQueue.findMany({
      where: {
        status: { in: ['IN_QUEUE', 'OFFERED'] },
        expiresAt: { not: null, lt: now },
      },
    });
    for (const q of expiredQueues) {
      await this.prisma.driverQueue.update({
        where: { id: q.id },
        data: { status: 'REMOVED_INACTIVE', availableSeats: 0 },
      });
      await this.logQueueEvent(this.prisma, q.id, 'EXPIRED');
    }
    const expiredOffers = await this.prisma.driverOffer.findMany({
      where: { status: 'PENDING', expiresAt: { lt: now } },
      include: { request: true },
    });
    for (const offer of expiredOffers) {
      await this.prisma.$transaction(async (tx) => {
        await tx.driverOffer.update({
          where: { id: offer.id },
          data: { status: 'EXPIRED' },
        });
        await tx.rideRequest.update({
          where: { id: offer.requestId },
          data: { status: 'PENDING', currentOfferId: null },
        });
        const queue = await tx.driverQueue.findUnique({
          where: { driverId_routeId: { driverId: offer.driverId, routeId: offer.routeId } },
        });
        if (queue) {
          const ttlAt = new Date(now.getTime() + TTL_SEC * 1000);
          await tx.driverQueue.update({
            where: { id: queue.id },
            data: { status: 'IN_QUEUE', joinedAt: now, expiresAt: ttlAt, lastPingAt: now, calledExpiresAt: null },
          });
          await tx.queueEvent.create({
            data: { queueId: queue.id, eventType: 'TIMEOUT', metaJson: { requestId: offer.requestId, offerId: offer.id } as Prisma.InputJsonValue },
          });
        }
      });
      await this.dispatchOffer(offer.requestId);
    }
  }

  async createRequest(passengerId: string, dto: CreateRideRequestDto) {
    const route = await this.prisma.taxiRoute.findUnique({ where: { id: dto.routeId } });
    if (!route || route.status !== 'ACTIVE') {
      throw new BadRequestException('Route not found');
    }
    if (dto.clientRequestId) {
      const existing = await this.prisma.rideRequest.findFirst({
        where: {
          clientRequestId: dto.clientRequestId,
          passengerId,
          routeId: dto.routeId,
          status: { in: ['PENDING', 'OFFER_SENT'] },
        },
      });
      if (existing) {
        const queuePosition = await this.prisma.rideRequest.count({
          where: {
            routeId: dto.routeId,
            status: { in: ['PENDING', 'OFFER_SENT'] },
            createdAt: { lte: existing.createdAt },
          },
        });
        return {
          ...existing,
          routeStatus: route.status,
          queuePosition,
          estimatedDepartureType: existing.departureType,
        };
      }
    }
    const request = await this.prisma.rideRequest.create({
      data: {
        routeId: dto.routeId,
        passengerId,
        pickupText: dto.pickupText,
        seats: dto.seats ?? 1,
        cargoType: dto.cargoType,
        departureType: dto.departureType,
        waitUntilFull: dto.waitUntilFull ?? false,
        status: 'PENDING',
        clientRequestId: dto.clientRequestId ?? undefined,
      },
    });
    await this.dispatchOffer(request.id);
    const queuePosition = await this.prisma.rideRequest.count({
      where: {
        routeId: dto.routeId,
        status: 'PENDING',
        createdAt: { lte: request.createdAt },
      },
    });
    return {
      ...request,
      routeStatus: route.status,
      queuePosition,
      estimatedDepartureType: dto.departureType,
    };
  }

  async getRequest(id: string) {
    const request = await this.prisma.rideRequest.findUnique({
      where: { id },
      include: {
        offers: true,
        route: { include: { fromHub: true, toHub: true } },
        assignedDriver: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    return request;
  }

  async acceptOffer(offerId: string, driverId: string, actionId?: string) {
    if (actionId) {
      const existing = await this.prisma.offerAcceptIdempotency.findUnique({
        where: { actionId },
      });
      if (existing) {
        return existing.responseJson as object;
      }
    }
    let result: { request?: { id: string; passengerId?: string }; routeId?: string } | { ok: false; reason: string; status: string };
    try {
      result = await this.prisma.$transaction(async (tx) => {
      const offer = await tx.driverOffer.findUnique({ where: { id: offerId } });
      if (!offer) {
        throw new NotFoundException('Offer not found');
      }
      if (offer.driverId !== driverId) {
        throw new BadRequestException('Offer does not belong to driver');
      }
      if (offer.status !== 'PENDING') {
        throw new BadRequestException('Offer not pending');
      }
      if (offer.expiresAt < new Date()) {
        await tx.driverOffer.update({ where: { id: offerId }, data: { status: 'EXPIRED' } });
        throw new BadRequestException('Offer expired');
      }
      const request = await tx.rideRequest.findUnique({ where: { id: offer.requestId } });
      if (!request) {
        throw new NotFoundException('Request not found');
      }
      if (request.status !== 'PENDING') {
        await tx.driverOffer.update({ where: { id: offerId }, data: { status: 'EXPIRED' } });
        return { ok: false, reason: 'REQUEST_NOT_PENDING', status: request.status };
      }
      await this.ensureSeatsAvailable(tx, driverId, offer.routeId, request.seats);
      await tx.driverOffer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } });
      await tx.rideRequest.update({
        where: { id: offer.requestId },
        data: {
          status: 'MATCHED',
          assignedDriverId: driverId,
        },
      });
      await this.syncQueueSeats(tx, driverId, offer.routeId);
      const queueRow = await tx.driverQueue.findUnique({
        where: { driverId_routeId: { driverId, routeId: offer.routeId } },
      });
      if (queueRow) {
        await tx.queueEvent.create({
          data: { queueId: queueRow.id, eventType: 'ACCEPT', metaJson: { requestId: offer.requestId, offerId } as Prisma.InputJsonValue },
        });
      }
      return { request, routeId: offer.routeId };
      });
    } catch (err) {
      throw err;
    }
    if (actionId) {
      await this.prisma.offerAcceptIdempotency.create({
        data: {
          actionId,
          offerId: offerId,
          responseJson: result as Prisma.InputJsonValue,
        },
      });
    }
    if ('request' in result && result.request && 'routeId' in result && result.routeId) {
      const passengerId = result.request.passengerId;
      const routeId = result.routeId;
      const requestId = result.request.id;
      if (passengerId && requestId) {
        const driver = await this.prisma.user.findUnique({
          where: { id: driverId },
          select: { displayName: true },
        });
        const driverName = driver?.displayName ?? 'Жүргізуші';
        const title = 'Такси келеді';
        const body = `${driverName} қабылдады. Таксиді күтіңіз.`;
        await this.notificationsService.createForUsers([passengerId], {
          type: 'TAXI_MATCHED',
          title,
          body,
          dataJson: { requestId, driverId, routeId },
        });
        await this.notificationsService.sendPushToUsers([passengerId], {
          title,
          body,
          data: { type: 'TAXI_MATCHED', requestId, driverId, routeId },
        });
      }
    }
    return result;
  }

  async rejectOffer(offerId: string, driverId: string) {
    const offer = await this.prisma.driverOffer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.driverId !== driverId) {
      throw new BadRequestException('Offer does not belong to driver');
    }
    if (offer.status !== 'PENDING') {
      throw new BadRequestException('Offer not pending');
    }
    await this.prisma.driverOffer.update({ where: { id: offerId }, data: { status: 'REJECTED' } });
    const queueRow = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId: offer.routeId } },
    });
    if (queueRow) {
      await this.logQueueEvent(this.prisma, queueRow.id, 'DECLINE', { requestId: offer.requestId, offerId });
    }
    const now = new Date();
    const ttlAt = new Date(now.getTime() + TTL_SEC * 1000);
    await this.prisma.driverQueue.update({
      where: { driverId_routeId: { driverId, routeId: offer.routeId } },
      data: { status: 'IN_QUEUE', joinedAt: now, expiresAt: ttlAt, lastPingAt: now, calledExpiresAt: null },
    });
    await this.prisma.rideRequest.update({
      where: { id: offer.requestId },
      data: { status: 'PENDING', currentOfferId: null },
    });
    await this.dispatchOffer(offer.requestId);
    return { ok: true };
  }

  async markOnTheWay(requestId: string, driverId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.assignedDriverId !== driverId) {
      throw new BadRequestException('Not assigned to this driver');
    }
    return this.prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'DRIVER_EN_ROUTE' },
    });
  }

  async markArrived(requestId: string, driverId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.assignedDriverId !== driverId) {
      throw new BadRequestException('Not assigned to this driver');
    }
    if (request.status !== 'DRIVER_EN_ROUTE') {
      throw new BadRequestException('Request not on the way');
    }
    const updated = await this.prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'CONFIRMED' },
    });
    const passengerId = updated.passengerId;
    if (passengerId) {
      await this.notificationsService.createForUsers([passengerId], {
        type: 'TAXI_ARRIVED',
        title: 'Жүргізуші келді',
        body: 'Кездесу орнына келді. Шығыңыз.',
        dataJson: { requestId: updated.id, driverId },
      });
      await this.notificationsService.sendPushToUsers([passengerId], {
        title: 'Жүргізуші келді',
        body: 'Кездесу орнына келді. Шығыңыз.',
        data: { type: 'TAXI_ARRIVED', requestId: updated.id, driverId },
      });
    }
    return updated;
  }

  async markPickedUpByPassenger(requestId: string, passengerId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.passengerId !== passengerId) {
      throw new BadRequestException('Not allowed');
    }
    if (!request.assignedDriverId) {
      throw new BadRequestException('Driver not assigned');
    }
    await this.ensureSeatsAvailable(this.prisma, request.assignedDriverId, request.routeId, request.seats);
    const updated = await this.prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'IN_RIDE' },
    });
    await this.syncQueueSeats(this.prisma, request.assignedDriverId, request.routeId);
    return updated;
  }

  async markPickedUpByDriver(requestId: string, driverId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.assignedDriverId !== driverId) {
      throw new BadRequestException('Not assigned to this driver');
    }
    await this.ensureSeatsAvailable(this.prisma, driverId, request.routeId, request.seats);
    const updated = await this.prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'IN_RIDE' },
    });
    await this.syncQueueSeats(this.prisma, driverId, request.routeId);
    return updated;
  }

  async markPassengerReady(requestId: string, passengerId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.passengerId !== passengerId) {
      throw new BadRequestException('Not allowed');
    }
    if (!request.assignedDriverId) {
      throw new BadRequestException('Driver not assigned');
    }
    const title = 'Жолаушы дайын';
    const body = 'Жолаушы дайын екенін растады.';
    await this.notificationsService.createForUsers([request.assignedDriverId], {
      type: 'PASSENGER_READY',
      title,
      body,
      dataJson: { requestId, passengerId },
    });
    await this.notificationsService.sendPushToUsers([request.assignedDriverId], {
      title,
      body,
      data: { type: 'PASSENGER_READY', requestId, passengerId },
    });
    return { ok: true };
  }

  async getActiveDriverRequest(driverId: string) {
    return this.prisma.rideRequest.findFirst({
      where: {
        assignedDriverId: driverId,
        status: { in: ['MATCHED', 'CONFIRMED', 'DRIVER_EN_ROUTE', 'IN_RIDE'] },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        passenger: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        route: { include: { fromHub: true, toHub: true } },
      },
    });
  }

  async completeRequest(requestId: string, driverId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!request) {
        throw new NotFoundException('Request not found');
      }
      if (request.assignedDriverId !== driverId) {
        throw new BadRequestException('Not assigned to this driver');
      }
      await tx.rideRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED' },
      });
      const queue = await this.syncQueueSeats(tx, driverId, request.routeId);
      if (queue?.status === 'IN_QUEUE') {
        await tx.driverQueue.update({
          where: { driverId_routeId: { driverId, routeId: request.routeId } },
          data: { joinedAt: new Date() },
        });
      }
      return { ok: true };
    });
  }

  async cancelRequest(requestId: string, passengerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!request) {
        throw new NotFoundException('Request not found');
      }
      if (request.passengerId !== passengerId) {
        throw new BadRequestException('Not allowed');
      }
      if (request.status === 'CANCELLED_BY_PASSENGER') {
        return request;
      }
      const wasAssigned = ['MATCHED', 'CONFIRMED', 'DRIVER_EN_ROUTE', 'IN_RIDE'].includes(request.status);
      if (request.assignedDriverId) {
        const queue = await tx.driverQueue.findUnique({
          where: { driverId_routeId: { driverId: request.assignedDriverId, routeId: request.routeId } },
        });
        if (queue && wasAssigned) {
          await this.syncQueueSeats(tx, request.assignedDriverId, request.routeId);
        }
      }
      return tx.rideRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED_BY_PASSENGER' },
      });
    });
  }

  private async expireConfirmedRequests(routeId: string, expireMinutes: number) {
    const cutoff = new Date(Date.now() - expireMinutes * 60 * 1000);
    const expired = await this.prisma.rideRequest.findMany({
      where: {
        routeId,
        status: 'MATCHED',
        updatedAt: { lt: cutoff },
      },
    });
    if (!expired.length) return;
    await this.prisma.$transaction(async (tx) => {
      for (const req of expired) {
        if (req.assignedDriverId) {
          await this.syncQueueSeats(tx, req.assignedDriverId, req.routeId);
        }
        await tx.rideRequest.update({
          where: { id: req.id },
          data: { status: 'EXPIRED' },
        });
      }
    });
  }

  private async getActiveSeatCount(
    tx: Prisma.TransactionClient | PrismaService,
    driverId: string,
    routeId: string,
  ) {
    const aggregate = await tx.rideRequest.aggregate({
      _sum: { seats: true },
      where: {
        routeId,
        assignedDriverId: driverId,
        status: { in: ['IN_RIDE'] },
      },
    });
    return aggregate._sum.seats ?? 0;
  }

  private async ensureSeatsAvailable(
    tx: Prisma.TransactionClient | PrismaService,
    driverId: string,
    routeId: string,
    seatsNeeded: number,
  ) {
    const queue = await tx.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId } },
    });
    if (!queue) {
      throw new NotFoundException('Not in queue');
    }
    const activeSeats = await this.getActiveSeatCount(tx, driverId, routeId);
    const available = queue.capacity - activeSeats;
    if (available < seatsNeeded) {
      throw new BadRequestException('No available seats');
    }
    return queue;
  }

  private async syncQueueSeats(
    tx: Prisma.TransactionClient | PrismaService,
    driverId: string,
    routeId: string,
  ) {
    const queue = await tx.driverQueue.findUnique({
      where: { driverId_routeId: { driverId, routeId } },
    });
    if (!queue) {
      return null;
    }
    const activeSeats = await this.getActiveSeatCount(tx, driverId, routeId);
    const available = Math.max(queue.capacity - activeSeats, 0);
    const nextStatus =
      queue.status === 'OFFERED' ? 'OFFERED' : available === 0 ? 'ON_TRIP' : 'IN_QUEUE';
    return tx.driverQueue.update({
      where: { driverId_routeId: { driverId, routeId } },
      data: { availableSeats: available, status: nextStatus },
    });
  }

  private async dispatchOffer(requestId: string) {
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== 'PENDING') {
      return;
    }
    const now = new Date();
    const nextDriver = await this.prisma.driverQueue.findFirst({
      where: {
        routeId: request.routeId,
        status: 'IN_QUEUE',
        expiresAt: { not: null, gt: now },
      },
      orderBy: { joinedAt: 'asc' },
    });
    if (!nextDriver) {
      return;
    }
    const expiresAt = new Date(Date.now() + OFFER_TTL_SECONDS * 1000);
    const calledExpiresAt = expiresAt;
    const existingOffer = await this.prisma.driverOffer.findUnique({
      where: { requestId_driverId: { requestId, driverId: nextDriver.driverId } },
    });
    let offer = existingOffer;
    let shouldNotify = true;
    if (existingOffer?.status === 'PENDING' && existingOffer.expiresAt > new Date()) {
      shouldNotify = false;
    } else if (existingOffer) {
      offer = await this.prisma.driverOffer.update({
        where: { requestId_driverId: { requestId, driverId: nextDriver.driverId } },
        data: {
          routeId: request.routeId,
          expiresAt,
          status: 'PENDING',
        },
      });
    } else {
      offer = await this.prisma.driverOffer.create({
        data: {
          requestId,
          driverId: nextDriver.driverId,
          routeId: request.routeId,
          expiresAt,
          status: 'PENDING',
        },
      });
    }
    await this.prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'OFFER_SENT', currentOfferId: offer?.id ?? null },
    });
    await this.prisma.driverQueue.update({
      where: { driverId_routeId: { driverId: nextDriver.driverId, routeId: request.routeId } },
      data: { status: 'OFFERED', calledExpiresAt },
    });
    const queueRow = await this.prisma.driverQueue.findUnique({
      where: { driverId_routeId: { driverId: nextDriver.driverId, routeId: request.routeId } },
    });
    if (queueRow) {
      await this.logQueueEvent(this.prisma, queueRow.id, 'CALLED', { requestId, offerId: offer?.id });
    }
    if (!offer || !shouldNotify) {
      return;
    }
    const route = await this.prisma.taxiRoute.findUnique({
      where: { id: request.routeId },
      include: { fromHub: true, toHub: true },
    });
    const fromLabel = route?.fromHub?.name ?? 'Бастапқы нүкте';
    const toLabel = route?.toHub?.name ?? 'Барар нүкте';
    const title = 'Жаңа жолаушы тапсырысы';
    const body = `${fromLabel} → ${toLabel}`;
    await this.notificationsService.createForUsers([nextDriver.driverId], {
      type: 'TAXI_OFFER',
      title,
      body,
      dataJson: {
        offerId: offer.id,
        requestId,
        routeId: request.routeId,
      },
    });
    await this.notificationsService.sendPushToUsers([nextDriver.driverId], {
      title,
      body,
      data: {
        type: 'TAXI_OFFER',
        offerId: offer.id,
        requestId,
        routeId: request.routeId,
      },
    });
  }
}
