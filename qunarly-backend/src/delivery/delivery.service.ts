import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import {
  DeliveryLegStatus,
  DeliveryRequestStatus,
  DriverType,
  DropPickStatus,
  HandoffMethod,
  HandoffStatus,
  OrderStatus,
  Prisma,
  ProofEntityType,
  ProofEventType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ArriveLegDto,
  DriverLocationDto,
  DropPickDropDto,
  DropPickPickupDto,
  HandoffAckDto,
  HandoffConfirmDto,
  ProofEventsBatchDto,
} from './dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async listAvailable(regionText?: string) {
    const where: any = { status: DeliveryLegStatus.OFFERING, driverId: null };
    if (regionText) {
      where.fromLocation = { contains: regionText, mode: 'insensitive' };
    }
    return this.prisma.deliveryLeg.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMine(driverId: string) {
    return this.prisma.deliveryLeg.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptLeg(legId: string, driverId: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.deliveryLeg.updateMany({
        where: { id: legId, status: DeliveryLegStatus.OFFERING, driverId: null },
        data: { driverId, status: DeliveryLegStatus.ACCEPTED, acceptedAt: new Date() },
      });
      if (result.count === 0) {
        throw new ConflictException('Leg already accepted');
      }
      const refreshed = await tx.deliveryLeg.findUnique({ where: { id: legId } });
      if (!refreshed) {
        throw new NotFoundException('Delivery leg not found');
      }
      await this.updateRequestStatusOnAccept(tx, refreshed);
      await tx.order.update({
        where: { id: refreshed.orderId },
        data: { status: OrderStatus.IN_FULFILLMENT },
      });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.LEG_ACCEPTED,
        entityType: ProofEntityType.LEG,
        entityId: refreshed.id,
        actorUserId: driverId,
        orderId: refreshed.orderId,
        requestId: refreshed.requestId,
        legId: refreshed.id,
      });
      return refreshed;
    });

    const order = await this.prisma.order.findUnique({
      where: { id: updated.orderId },
      include: { listing: true },
    });
    if (order) {
      await this.notificationsService.createForUsers(
        [order.buyerId, order.sellerId],
        {
          type: 'LEG_ACCEPTED',
          title: 'Жеткізу қабылданды',
          body: `${order.listing?.title ?? 'Тапсырыс'} бойынша кезең қабылданды.`,
          dataJson: { orderId: order.id, legId: updated.id },
        },
      );
    }

    return updated;
  }

  async rejectLeg(legId: string, driverId: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== driverId) {
      throw new BadRequestException('Not allowed');
    }
    return this.prisma.deliveryLeg.update({
      where: { id: legId },
      data: { driverId: null, status: DeliveryLegStatus.OFFERING, acceptedAt: null },
    });
  }

  async requeueLeg(legId: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (!(leg.status === DeliveryLegStatus.ACCEPTED || leg.status === DeliveryLegStatus.STARTED)) {
      throw new BadRequestException('Leg is not in ACCEPTED or STARTED state');
    }
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (leg.updatedAt > tenMinutesAgo) {
      throw new BadRequestException('Leg is not timed out yet');
    }
    return this.prisma.deliveryLeg.update({
      where: { id: legId },
      data: {
        driverId: null,
        status: DeliveryLegStatus.OFFERING,
        acceptedAt: null,
        startedAt: null,
      },
    });
  }

  async startLeg(legId: string, driverId: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== driverId) {
      throw new ForbiddenException('Not allowed');
    }
    if (leg.status === DeliveryLegStatus.OFFERING && !leg.driverId) {
      throw new BadRequestException('Leg must be accepted before start');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.deliveryLeg.updateMany({
        where: { id: legId, driverId, status: DeliveryLegStatus.ACCEPTED },
        data: { status: DeliveryLegStatus.STARTED, startedAt: new Date() },
      });
      if (result.count === 0) {
        throw new ConflictException('Leg cannot be started');
      }
      const refreshed = await tx.deliveryLeg.findUnique({ where: { id: legId } });
      if (!refreshed) {
        throw new NotFoundException('Delivery leg not found');
      }
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.LEG_STARTED,
        entityType: ProofEntityType.LEG,
        entityId: refreshed.id,
        actorUserId: driverId,
        orderId: refreshed.orderId,
        requestId: refreshed.requestId,
        legId: refreshed.id,
      });
      return refreshed;
    });
    const order = updated
      ? await this.prisma.order.findUnique({
          where: { id: updated.orderId },
          include: { listing: true },
        })
      : null;
    if (order) {
      await this.notificationsService.createForUsers(
        [order.buyerId, order.sellerId],
        {
          type: 'LEG_STARTED',
          title: 'Жеткізу басталды',
          body: `${order.listing?.title ?? 'Тапсырыс'} бойынша кезең жолға шықты.`,
          dataJson: { orderId: order.id, legId },
        },
      );
    }
    return updated;
  }

  async arriveLeg(legId: string, driverId: string, dto: ArriveLegDto) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== driverId) {
      throw new ForbiddenException('Not allowed');
    }
    if (leg.status !== DeliveryLegStatus.STARTED) {
      throw new BadRequestException('Leg is not in STARTED state');
    }
    let arrivedHubId = leg.toHubId ?? null;
    if (leg.toHubId) {
      const hub = await this.prisma.hub.findUnique({ where: { id: leg.toHubId } });
      if (!hub) {
        throw new NotFoundException('Hub not found');
      }
      const distanceKm = this.haversineKm({ lat: dto.lat, lng: dto.lng }, { lat: hub.lat, lng: hub.lng });
      const hubRadiusKm = (hub as any).radiusKm ?? (((hub as any).radiusMeters ?? 800) / 1000);
      if (distanceKm > hubRadiusKm) {
        throw new BadRequestException('Driver is outside hub geofence');
      }
      arrivedHubId = hub.id;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryLeg.update({
        where: { id: legId },
        data: {
          status: DeliveryLegStatus.ARRIVED,
          arrivedAt: new Date(),
          arrivedLat: dto.lat,
          arrivedLng: dto.lng,
          arrivedHubId: arrivedHubId ?? undefined,
        },
      });
      await this.updateRequestStatusOnArrive(tx, updated);
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.LEG_ARRIVED,
        entityType: ProofEntityType.LEG,
        entityId: updated.id,
        actorUserId: driverId,
        orderId: updated.orderId,
        requestId: updated.requestId,
        legId: updated.id,
        lat: dto.lat,
        lng: dto.lng,
      });
      return updated;
    });
  }

  async completeLeg(legId: string, driverId: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== driverId) {
      throw new ForbiddenException('Not allowed');
    }
    if (leg.status !== DeliveryLegStatus.ARRIVED) {
      throw new BadRequestException('Leg must be ARRIVED before completion');
    }
    const nextLeg = await this.prisma.deliveryLeg.findFirst({
      where: { requestId: leg.requestId, sortOrder: { gt: leg.sortOrder } },
      orderBy: { sortOrder: 'asc' },
    });
    if (nextLeg) {
      throw new BadRequestException('Intermediate legs must be completed via handoff');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.deliveryLeg.updateMany({
        where: { id: legId, driverId, status: DeliveryLegStatus.ARRIVED },
        data: { status: DeliveryLegStatus.COMPLETED, completedAt: new Date() },
      });
      if (result.count === 0) {
        throw new ConflictException('Leg cannot be completed');
      }
      const refreshed = await tx.deliveryLeg.findUnique({ where: { id: legId } });
      if (!refreshed) {
        throw new NotFoundException('Delivery leg not found');
      }
      await tx.deliveryRequest.update({
        where: { id: refreshed.requestId },
        data: { status: DeliveryRequestStatus.DELIVERED },
      });
      await tx.order.update({
        where: { id: refreshed.orderId },
        data: { status: OrderStatus.DELIVERED },
      });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.LEG_COMPLETED,
        entityType: ProofEntityType.LEG,
        entityId: refreshed.id,
        actorUserId: driverId,
        orderId: refreshed.orderId,
        requestId: refreshed.requestId,
        legId: refreshed.id,
      });
      await this.logCommissionEventTx(tx, {
        orderId: refreshed.orderId,
        requestId: refreshed.requestId,
        legId: refreshed.id,
        eventType: ProofEventType.LEG_COMPLETED,
        legFee: refreshed.price,
      });
      return refreshed;
    });

    const order = await this.prisma.order.findUnique({
      where: { id: updated.orderId },
      include: { listing: true },
    });
    if (order) {
      await this.notificationsService.createForUsers(
        [order.buyerId, order.sellerId],
        {
          type: 'LEG_COMPLETED',
          title: 'Кезең аяқталды',
          body: `${order.listing?.title ?? 'Тапсырыс'} бойынша кезең аяқталды.`,
          dataJson: { orderId: order.id, legId },
        },
      );
    }

    return updated;
  }

  async createHandoffToken(legId: string, receiverUserId: string) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== receiverUserId) {
      throw new ForbiddenException('Not allowed');
    }
    if (leg.status !== DeliveryLegStatus.ACCEPTED) {
      throw new BadRequestException('Leg is not in ACCEPTED state');
    }
    const rawToken = randomBytes(16).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    await this.prisma.handoffToken.create({
      data: {
        legId,
        receiverUserId,
        tokenHash,
        expiresAt,
      },
    });
    return { token: rawToken, expiresAt };
  }

  async confirmHandoff(legId: string, senderUserId: string, dto: HandoffConfirmDto) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const token = await this.prisma.handoffToken.findFirst({
      where: { legId, tokenHash },
    });
    if (!token) {
      throw new BadRequestException('Invalid token');
    }
    if (token.usedAt) {
      throw new ConflictException('Token already used');
    }
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }
    if (leg.driverId !== token.receiverUserId) {
      throw new ForbiddenException('Receiver mismatch');
    }
    const previousLeg = await this.prisma.deliveryLeg.findFirst({
      where: {
        requestId: leg.requestId,
        sortOrder: { lt: leg.sortOrder },
      },
      orderBy: { sortOrder: 'desc' },
    });
    if (!previousLeg) {
      throw new BadRequestException('Previous leg not found');
    }
    if (previousLeg.driverId !== senderUserId) {
      throw new ForbiddenException('Not allowed');
    }
    if (previousLeg.status !== DeliveryLegStatus.ARRIVED) {
      throw new BadRequestException('Previous leg is not in ARRIVED state');
    }

    let receiverLat = dto.receiverLat;
    let receiverLng = dto.receiverLng;
    if (typeof receiverLat !== 'number' || typeof receiverLng !== 'number') {
      const receiverDriver = await this.prisma.driver.findUnique({
        where: { userId: token.receiverUserId },
        include: { location: true },
      });
      const receiverLocation = receiverDriver?.location ?? null;
      receiverLat = receiverLocation?.lat;
      receiverLng = receiverLocation?.lng;
    }
    if (typeof receiverLat !== 'number' || typeof receiverLng !== 'number') {
      throw new BadRequestException('Receiver location not found');
    }
    const distanceKm = this.haversineKm(
      { lat: dto.senderLat, lng: dto.senderLng },
      { lat: receiverLat, lng: receiverLng },
    );
    if (distanceKm > 0.1) {
      throw new BadRequestException('Receiver is not nearby');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.handoffToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      });
      const existingHandoff = await tx.handoff.findUnique({
        where: { fromLegId: previousLeg.id },
      });
      if (existingHandoff && existingHandoff.toLegId !== leg.id) {
        throw new ConflictException('Handoff already linked to a different leg');
      }
      const handoff = existingHandoff
        ? await tx.handoff.update({
            where: { id: existingHandoff.id },
            data: {
              method: HandoffMethod.LIVE,
              status: HandoffStatus.FROM_CONFIRMED,
              senderLat: dto.senderLat,
              senderLng: dto.senderLng,
              fromConfirmedAt: new Date(),
            },
          })
        : await tx.handoff.create({
            data: {
              fromLegId: previousLeg.id,
              toLegId: leg.id,
              method: HandoffMethod.LIVE,
              status: HandoffStatus.FROM_CONFIRMED,
              senderLat: dto.senderLat,
              senderLng: dto.senderLng,
              fromConfirmedAt: new Date(),
            },
          });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.HANDOFF_FROM_CONFIRMED,
        entityType: ProofEntityType.HANDOFF,
        entityId: handoff.id,
        actorUserId: senderUserId,
        orderId: previousLeg.orderId,
        requestId: previousLeg.requestId,
        legId: previousLeg.id,
        handoffId: handoff.id,
        lat: dto.senderLat,
        lng: dto.senderLng,
      });
      return handoff;
    });
  }

  async confirmHandoffReceive(legId: string, receiverUserId: string, dto: HandoffAckDto) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== receiverUserId) {
      throw new ForbiddenException('Not allowed');
    }
    const previousLeg = await this.prisma.deliveryLeg.findFirst({
      where: { requestId: leg.requestId, sortOrder: { lt: leg.sortOrder } },
      orderBy: { sortOrder: 'desc' },
    });
    if (!previousLeg) {
      throw new BadRequestException('Previous leg not found');
    }
    const handoff = await this.prisma.handoff.findUnique({
      where: { fromLegId: previousLeg.id },
    });
    if (!handoff || handoff.toLegId !== leg.id || handoff.status !== HandoffStatus.FROM_CONFIRMED) {
      throw new BadRequestException('Handoff is not ready for receiver confirmation');
    }
    if (typeof handoff.senderLat !== 'number' || typeof handoff.senderLng !== 'number') {
      throw new BadRequestException('Sender location not found');
    }

    let receiverLat = dto.receiverLat;
    let receiverLng = dto.receiverLng;
    if (typeof receiverLat !== 'number' || typeof receiverLng !== 'number') {
      const receiverDriver = await this.prisma.driver.findUnique({
        where: { userId: receiverUserId },
        include: { location: true },
      });
      const receiverLocation = receiverDriver?.location ?? null;
      receiverLat = receiverLocation?.lat;
      receiverLng = receiverLocation?.lng;
    }
    if (typeof receiverLat !== 'number' || typeof receiverLng !== 'number') {
      throw new BadRequestException('Receiver location not found');
    }
    const distanceKm = this.haversineKm(
      { lat: handoff.senderLat, lng: handoff.senderLng },
      { lat: receiverLat, lng: receiverLng },
    );
    if (distanceKm > 0.1) {
      throw new BadRequestException('Receiver is not nearby');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedHandoff = await tx.handoff.update({
        where: { id: handoff.id },
        data: {
          status: HandoffStatus.COMPLETED,
          receiverLat,
          receiverLng,
          toConfirmedAt: new Date(),
          completedAt: new Date(),
        },
      });
      await tx.deliveryLeg.update({
        where: { id: previousLeg.id },
        data: { status: DeliveryLegStatus.COMPLETED, completedAt: new Date() },
      });
      await tx.deliveryLeg.update({
        where: { id: leg.id },
        data: {
          status: leg.status === DeliveryLegStatus.ACCEPTED ? DeliveryLegStatus.STARTED : leg.status,
          startedAt: leg.startedAt ?? new Date(),
        },
      });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.HANDOFF_TO_CONFIRMED,
        entityType: ProofEntityType.HANDOFF,
        entityId: updatedHandoff.id,
        actorUserId: receiverUserId,
        orderId: leg.orderId,
        requestId: leg.requestId,
        legId: leg.id,
        handoffId: updatedHandoff.id,
        lat: receiverLat,
        lng: receiverLng,
      });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.HANDOFF_COMPLETED,
        entityType: ProofEntityType.HANDOFF,
        entityId: updatedHandoff.id,
        actorUserId: receiverUserId,
        orderId: leg.orderId,
        requestId: leg.requestId,
        legId: leg.id,
        handoffId: updatedHandoff.id,
      });
      await this.logCommissionEventTx(tx, {
        orderId: previousLeg.orderId,
        requestId: previousLeg.requestId,
        legId: previousLeg.id,
        eventType: ProofEventType.HANDOFF_COMPLETED,
        legFee: previousLeg.price,
      });
      return updatedHandoff;
    });
  }

  async completeHubHandoff(legId: string, driverId: string, dto: { lat?: number; lng?: number; proofCode?: string }) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== driverId) {
      throw new ForbiddenException('Not allowed');
    }
    if (leg.status !== DeliveryLegStatus.ARRIVED) {
      throw new BadRequestException('Leg must be ARRIVED before handoff');
    }
    const nextLeg = await this.prisma.deliveryLeg.findFirst({
      where: { requestId: leg.requestId, sortOrder: { gt: leg.sortOrder } },
      orderBy: { sortOrder: 'asc' },
    });
    if (!nextLeg) {
      throw new BadRequestException('Next leg not found');
    }
    const arrivalProof = await this.prisma.proofEvent.findFirst({
      where: { orderId: leg.orderId, legId: leg.id, eventType: ProofEventType.LEG_ARRIVED },
    });
    if (!arrivalProof) {
      throw new BadRequestException('Arrival proof is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedLeg = await tx.deliveryLeg.update({
        where: { id: leg.id },
        data: { status: DeliveryLegStatus.COMPLETED, completedAt: new Date() },
      });
      await tx.deliveryRequest.update({
        where: { id: leg.requestId },
        data: { status: DeliveryRequestStatus.HUB },
      });
      if (nextLeg.status !== DeliveryLegStatus.OFFERING) {
        await tx.deliveryLeg.update({
          where: { id: nextLeg.id },
          data: { status: DeliveryLegStatus.OFFERING, driverId: null, acceptedAt: null },
        });
      }
      await this.logCommissionEventTx(tx, {
        orderId: leg.orderId,
        requestId: leg.requestId,
        legId: leg.id,
        eventType: ProofEventType.HANDOFF_COMPLETED,
        legFee: leg.price,
        metaJson: { proofCode: dto.proofCode ?? null, lat: dto.lat ?? null, lng: dto.lng ?? null },
      });
      this.logDebug('delivery.handoff.complete', {
        legId: leg.id,
        requestId: leg.requestId,
        nextLegId: nextLeg.id,
      });
      return updatedLeg;
    });
  }

  async dropPickDrop(legId: string, senderUserId: string, dto: DropPickDropDto) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== senderUserId) {
      throw new ForbiddenException('Not allowed');
    }
    if (leg.status !== DeliveryLegStatus.ARRIVED) {
      throw new BadRequestException('Leg must be ARRIVED before drop');
    }
    const nextLeg = await this.prisma.deliveryLeg.findFirst({
      where: { requestId: leg.requestId, sortOrder: { gt: leg.sortOrder } },
      orderBy: { sortOrder: 'asc' },
    });
    if (!nextLeg) {
      throw new BadRequestException('Next leg not found');
    }
    if (nextLeg.status !== DeliveryLegStatus.ACCEPTED) {
      throw new BadRequestException('Next leg must be ACCEPTED before drop');
    }

    const otp = (parseInt(randomBytes(3).toString('hex'), 16) % 1000000).toString().padStart(6, '0');
    const tokenHash = createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + (dto.pickupExpiresInMinutes ?? 120) * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const existingHandoff = await tx.handoff.findUnique({ where: { fromLegId: leg.id } });
      if (existingHandoff && existingHandoff.toLegId !== nextLeg.id) {
        throw new ConflictException('Handoff already linked to a different leg');
      }
      const handoff = existingHandoff
        ? await tx.handoff.update({
            where: { id: existingHandoff.id },
            data: {
              method: HandoffMethod.DROP_PICK,
              status: HandoffStatus.FROM_CONFIRMED,
              senderLat: dto.dropLat,
              senderLng: dto.dropLng,
              fromConfirmedAt: new Date(),
            },
          })
        : await tx.handoff.create({
            data: {
              fromLegId: leg.id,
              toLegId: nextLeg.id,
              method: HandoffMethod.DROP_PICK,
              status: HandoffStatus.FROM_CONFIRMED,
              senderLat: dto.dropLat,
              senderLng: dto.dropLng,
              fromConfirmedAt: new Date(),
            },
          });
      const dropPick = await tx.dropPick.create({
        data: {
          handoffId: handoff.id,
          status: DropPickStatus.DROPPED,
          droppedById: senderUserId,
          droppedAt: new Date(),
          dropLat: dto.dropLat,
          dropLng: dto.dropLng,
          dropPhoto1Id: dto.dropPhoto1Id,
          dropPhoto2Id: dto.dropPhoto2Id,
          pickupTokenHash: tokenHash,
          pickupExpiresAt: expiresAt,
        },
      });
      await tx.deliveryLeg.update({
        where: { id: leg.id },
        data: { status: DeliveryLegStatus.COMPLETED, completedAt: new Date() },
      });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.DROP_PICK_DROPPED,
        entityType: ProofEntityType.DROP_PICK,
        entityId: dropPick.id,
        actorUserId: senderUserId,
        orderId: leg.orderId,
        requestId: leg.requestId,
        legId: leg.id,
        handoffId: handoff.id,
        dropPickId: dropPick.id,
        lat: dto.dropLat,
        lng: dto.dropLng,
      });
      return { handoffId: handoff.id, dropPickId: dropPick.id, pickupToken: otp, pickupExpiresAt: expiresAt };
    });
  }

  async dropPickPickup(legId: string, receiverUserId: string, dto: DropPickPickupDto) {
    const leg = await this.prisma.deliveryLeg.findUnique({ where: { id: legId } });
    if (!leg) {
      throw new NotFoundException('Delivery leg not found');
    }
    if (leg.driverId !== receiverUserId) {
      throw new ForbiddenException('Not allowed');
    }
    const previousLeg = await this.prisma.deliveryLeg.findFirst({
      where: { requestId: leg.requestId, sortOrder: { lt: leg.sortOrder } },
      orderBy: { sortOrder: 'desc' },
    });
    if (!previousLeg) {
      throw new BadRequestException('Previous leg not found');
    }
    const handoff = await this.prisma.handoff.findUnique({
      where: { fromLegId: previousLeg.id },
    });
    if (!handoff || handoff.toLegId !== leg.id || handoff.method !== HandoffMethod.DROP_PICK) {
      throw new BadRequestException('Drop & pick handoff not found');
    }
    const dropPick = await this.prisma.dropPick.findUnique({ where: { handoffId: handoff.id } });
    if (!dropPick) {
      throw new BadRequestException('Drop & pick record not found');
    }
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    if (dropPick.pickupTokenHash !== tokenHash) {
      throw new BadRequestException('Invalid token');
    }
    if (dropPick.pickupExpiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }
    if (dropPick.status !== DropPickStatus.DROPPED) {
      throw new BadRequestException('Drop & pick is not available');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDropPick = await tx.dropPick.update({
        where: { id: dropPick.id },
        data: {
          status: DropPickStatus.PICKED_UP,
          pickupById: receiverUserId,
          pickupAt: new Date(),
          pickupLat: dto.pickupLat,
          pickupLng: dto.pickupLng,
          pickupPhoto1Id: dto.pickupPhoto1Id,
          pickupPhoto2Id: dto.pickupPhoto2Id,
        },
      });
      const updatedHandoff = await tx.handoff.update({
        where: { id: handoff.id },
        data: {
          status: HandoffStatus.COMPLETED,
          receiverLat: dto.pickupLat,
          receiverLng: dto.pickupLng,
          toConfirmedAt: new Date(),
          completedAt: new Date(),
        },
      });
      await tx.deliveryLeg.update({
        where: { id: leg.id },
        data: {
          status: leg.status === DeliveryLegStatus.ACCEPTED ? DeliveryLegStatus.STARTED : leg.status,
          startedAt: leg.startedAt ?? new Date(),
        },
      });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.DROP_PICK_PICKED_UP,
        entityType: ProofEntityType.DROP_PICK,
        entityId: updatedDropPick.id,
        actorUserId: receiverUserId,
        orderId: leg.orderId,
        requestId: leg.requestId,
        legId: leg.id,
        handoffId: updatedHandoff.id,
        dropPickId: updatedDropPick.id,
        lat: dto.pickupLat,
        lng: dto.pickupLng,
      });
      await this.logProofEventTx(tx, {
        eventType: ProofEventType.HANDOFF_COMPLETED,
        entityType: ProofEntityType.HANDOFF,
        entityId: updatedHandoff.id,
        actorUserId: receiverUserId,
        orderId: leg.orderId,
        requestId: leg.requestId,
        legId: leg.id,
        handoffId: updatedHandoff.id,
      });
      return updatedHandoff;
    });
  }

  async createProofEventsBatch(userId: string, dto: ProofEventsBatchDto) {
    const created: Array<{ eventKey?: string | null; id?: string | null }> = [];
    for (const event of dto.events) {
      const data = {
        eventKey: event.eventKey ?? undefined,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        actorUserId: event.actorUserId ?? userId,
        orderId: event.orderId ?? undefined,
        deliveryId: event.deliveryId ?? undefined,
        requestId: event.requestId ?? undefined,
        legId: event.legId ?? undefined,
        handoffId: event.handoffId ?? undefined,
        dropPickId: event.dropPickId ?? undefined,
        lat: event.lat ?? undefined,
        lng: event.lng ?? undefined,
        clientCreatedAt: event.clientCreatedAt ? new Date(event.clientCreatedAt) : undefined,
        metaJson: (event.metaJson as Prisma.InputJsonValue) ?? undefined,
      };
      if (event.eventKey) {
        const upserted = await this.prisma.proofEvent.upsert({
          where: { eventKey: event.eventKey },
          create: data,
          update: {},
          select: { id: true, eventKey: true },
        });
        created.push(upserted);
        continue;
      }
      const createdEvent = await this.prisma.proofEvent.create({
        data,
        select: { id: true },
      });
      created.push({ id: createdEvent.id });
    }
    return { created };
  }

  async updateDriverLocation(userId: string, dto: DriverLocationDto) {
    const driver = await this.prisma.driver.upsert({
      where: { userId },
      update: {
        driverType: dto.driverType ?? undefined,
        homeRegion: dto.homeRegion ?? undefined,
        routeCorridor: dto.routeCorridor ?? undefined,
        vehicleType: dto.vehicleType ?? undefined,
        capacityKg: dto.capacityKg ?? undefined,
      },
      create: {
        userId,
        driverType: dto.driverType ?? undefined,
        homeRegion: dto.homeRegion ?? undefined,
        routeCorridor: dto.routeCorridor ?? undefined,
        vehicleType: dto.vehicleType ?? undefined,
        capacityKg: dto.capacityKg ?? undefined,
      },
    });
    return this.prisma.driverLocation.upsert({
      where: { driverId: driver.id },
      update: {
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading ?? undefined,
        speed: dto.speed ?? undefined,
      },
      create: {
        driverId: driver.id,
        lat: dto.lat,
        lng: dto.lng,
        heading: dto.heading ?? undefined,
        speed: dto.speed ?? undefined,
      },
    });
  }

  async listDriversForDelivery(deliveryId: string, driverType?: string) {
    if (driverType && !Object.values(DriverType).includes(driverType as DriverType)) {
      throw new BadRequestException('Invalid driver type');
    }
    const legs = await this.prisma.deliveryLeg.findMany({
      where: { deliveryId },
      select: { driverId: true },
    });
    const driverIds = Array.from(new Set(legs.map((leg) => leg.driverId).filter(Boolean))) as string[];
    if (!driverIds.length) {
      return [];
    }
    const drivers = await this.prisma.driver.findMany({
      where: {
        userId: { in: driverIds },
        ...(driverType ? { driverType: driverType as DriverType } : {}),
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        location: true,
      },
    });
    return drivers
      .filter((driver) => driver.location)
      .map((driver) => ({
        id: driver.user.id,
        displayName: driver.user.displayName,
        avatarUrl: driver.user.avatarUrl,
        driverType: driver.driverType,
        lat: driver.location?.lat,
        lng: driver.location?.lng,
        heading: driver.location?.heading,
        speed: driver.location?.speed,
        updatedAt: driver.location?.updatedAt,
      }));
  }

  private async updateRequestStatusOnAccept(
    tx: Prisma.TransactionClient,
    leg: { requestId: string; sortOrder: number },
  ) {
    const totalLegs = await tx.deliveryLeg.count({ where: { requestId: leg.requestId } });
    let status: DeliveryRequestStatus | null = null;
    if (totalLegs <= 1) {
      status = DeliveryRequestStatus.LEG1;
    } else if (totalLegs === 2) {
      status = leg.sortOrder === 1 ? DeliveryRequestStatus.LEG1 : DeliveryRequestStatus.LEG2;
    } else if (totalLegs >= 3) {
      if (leg.sortOrder === 1) {
        status = DeliveryRequestStatus.LEG1;
      } else if (leg.sortOrder === 2) {
        status = DeliveryRequestStatus.LEG2;
      } else {
        status = DeliveryRequestStatus.LEG3;
      }
    }
    if (status) {
      await tx.deliveryRequest.update({
        where: { id: leg.requestId },
        data: { status },
      });
    }
  }

  private async updateRequestStatusOnArrive(
    tx: Prisma.TransactionClient,
    leg: { requestId: string; sortOrder: number },
  ) {
    const totalLegs = await tx.deliveryLeg.count({ where: { requestId: leg.requestId } });
    let status: DeliveryRequestStatus | null = null;
    if (totalLegs === 2 && leg.sortOrder === 1) {
      status = DeliveryRequestStatus.HUB;
    } else if (totalLegs >= 3) {
      if (leg.sortOrder === 1) {
        status = DeliveryRequestStatus.HUB;
      } else if (leg.sortOrder === 2) {
        status = DeliveryRequestStatus.CITY_HUB;
      }
    }
    if (status) {
      await tx.deliveryRequest.update({
        where: { id: leg.requestId },
        data: { status },
      });
    }
  }

  private async logProofEventTx(
    tx: Prisma.TransactionClient,
    params: {
      eventType: ProofEventType;
      entityType: ProofEntityType;
      entityId: string;
      actorUserId?: string;
      orderId?: string;
      deliveryId?: string;
      requestId?: string;
      legId?: string;
      handoffId?: string;
      dropPickId?: string;
      lat?: number;
      lng?: number;
      clientCreatedAt?: Date;
      metaJson?: any;
    },
  ) {
    await tx.proofEvent.create({
      data: {
        eventType: params.eventType,
        entityType: params.entityType,
        entityId: params.entityId,
        actorUserId: params.actorUserId,
        orderId: params.orderId,
        deliveryId: params.deliveryId,
        requestId: params.requestId,
        legId: params.legId,
        handoffId: params.handoffId,
        dropPickId: params.dropPickId,
        lat: params.lat,
        lng: params.lng,
        clientCreatedAt: params.clientCreatedAt,
        metaJson: params.metaJson as Prisma.InputJsonValue,
      },
    });
  }

  private async logCommissionEventTx(
    tx: Prisma.TransactionClient,
    params: {
      orderId: string;
      requestId: string;
      legId: string;
      eventType: ProofEventType;
      legFee: number;
      metaJson?: Record<string, unknown>;
    },
  ) {
    const rateApplied = 0.03;
    const amount = Number((params.legFee * rateApplied).toFixed(2));
    const eventKey = `commission:delivery:${params.orderId}:${params.legId}:${params.eventType}`;
    const existing = await tx.proofEvent.findUnique({ where: { eventKey } });
    if (existing) {
      this.logDebug('delivery.commission.skip', { eventKey });
      return;
    }
    await tx.proofEvent.create({
      data: {
        eventKey,
        eventType: params.eventType,
        entityType: ProofEntityType.LEG,
        entityId: params.legId,
        orderId: params.orderId,
        requestId: params.requestId,
        legId: params.legId,
        metaJson: {
          basis: 'DELIVERY_LEG',
          rateApplied,
          amount,
          legFee: params.legFee,
          ...(params.metaJson ?? {}),
        } as Prisma.InputJsonValue,
      },
    });
    this.logDebug('delivery.commission.write', { eventKey, amount });
  }

  private logDebug(event: string, payload: Record<string, unknown>) {
    if (process.env.LOG_LEVEL !== 'debug') return;
    this.logger.debug(`${event} ${JSON.stringify(payload)}`);
  }

  private haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  private toRad(value: number) {
    return (value * Math.PI) / 180;
  }
}
