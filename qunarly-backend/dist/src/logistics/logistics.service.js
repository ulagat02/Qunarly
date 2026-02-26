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
exports.LogisticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let LogisticsService = class LogisticsService {
    constructor(prisma, audit, notificationsService) {
        this.prisma = prisma;
        this.audit = audit;
        this.notificationsService = notificationsService;
        this.pricing = {
            basePrice: 2000,
            pricePerKm: 120,
            pricePerKg: 2,
            pricePerM3: 350,
            refrigeratedSurchargePct: 0.15,
            livestockSurchargePct: 0.12,
            closedBodySurchargePct: 0.08,
        };
    }
    async createShipment(requesterId, dto) {
        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
            select: { homeLat: true, homeLng: true, homeAddressText: true },
        });
        if (!requester?.homeLat || !requester?.homeLng || !requester?.homeAddressText) {
            throw new common_1.BadRequestException('Home location is required');
        }
        const resolvedDealId = dto.contractId ?? dto.dealId;
        if (resolvedDealId) {
            const deal = await this.prisma.deal.findUnique({ where: { id: resolvedDealId } });
            if (!deal) {
                throw new common_1.NotFoundException('Deal not found');
            }
        }
        const cargoJson = {
            ...(dto.cargoJson && typeof dto.cargoJson === 'object' ? dto.cargoJson : {}),
            ...(dto.cargoDescription ? { description: dto.cargoDescription } : {}),
            ...(dto.weightKg !== undefined ? { weightKg: dto.weightKg } : {}),
            ...(dto.volumeM3 !== undefined ? { volumeM3: dto.volumeM3 } : {}),
            ...(dto.cargoType ? { cargoType: dto.cargoType } : {}),
            ...(dto.packageType ? { packageType: dto.packageType } : {}),
            ...(dto.notes ? { notes: dto.notes } : {}),
            ...(dto.priceOffer !== undefined ? { priceOffer: dto.priceOffer } : {}),
        };
        const shipment = await this.prisma.shipmentJob.create({
            data: {
                requesterId,
                dealId: resolvedDealId,
                sourceType: resolvedDealId ? 'DEAL' : 'MANUAL',
                sourceId: resolvedDealId ?? undefined,
                originLat: dto.originLat,
                originLng: dto.originLng,
                destLat: dto.destLat,
                destLng: dto.destLng,
                originAddressText: dto.originAddressText,
                destAddressText: dto.destAddressText,
                originRegion: dto.originRegion,
                destRegion: dto.destRegion,
                cargoWeightKg: dto.weightKg,
                cargoVolumeM3: dto.volumeM3,
                cargoType: dto.cargoType,
                packageType: dto.packageType,
                cargoNotes: dto.notes,
                cargoJson: cargoJson,
                status: client_1.ShipmentJobStatus.CREATED,
            },
        });
        await this.applyPricing(shipment.id);
        if (resolvedDealId) {
            await this.prisma.dealShipmentLink.create({
                data: { dealId: resolvedDealId, shipmentId: shipment.id },
            });
        }
        await this.audit.log(requesterId, 'logistics.shipment.created', { shipmentId: shipment.id });
        return shipment;
    }
    async listShipments() {
        return this.prisma.shipmentJob.findMany();
    }
    async recommendCarriers(shipmentId, requesterId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id: shipmentId } });
        if (!shipment || shipment.requesterId !== requesterId) {
            throw new common_1.BadRequestException('Shipment not accessible');
        }
        return this.matchCarriers(shipment);
    }
    async assignCarrier(shipmentId, requesterId, carrierId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id: shipmentId } });
        if (!shipment || shipment.requesterId !== requesterId) {
            throw new common_1.BadRequestException('Shipment not accessible');
        }
        if (shipment.acceptedBy) {
            throw new common_1.BadRequestException('Shipment already assigned');
        }
        const updated = await this.prisma.shipmentJob.update({
            where: { id: shipmentId },
            data: { acceptedBy: carrierId, status: client_1.ShipmentJobStatus.OFFERED },
        });
        await this.applyPricing(shipmentId);
        await this.notificationsService.createForUsers([carrierId], {
            type: 'SHIPMENT_ASSIGNED',
            title: 'Жаңа тасымал',
            body: 'Сізге тасымал тапсырылды.',
            dataJson: { shipmentId },
        });
        return updated;
    }
    async getShipment(id) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id } });
        if (!shipment) {
            throw new common_1.NotFoundException('Shipment not found');
        }
        return shipment;
    }
    async acceptShipment(id, carrierId) {
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.shipmentJob.updateMany({
                where: { id, status: client_1.ShipmentJobStatus.OFFERED, acceptedBy: null },
                data: { acceptedBy: carrierId, status: client_1.ShipmentJobStatus.ASSIGNED },
            });
            if (result.count === 0) {
                throw new common_1.BadRequestException('Shipment is not available');
            }
            const refreshed = await tx.shipmentJob.findUnique({ where: { id } });
            if (refreshed && !refreshed.finalPrice) {
                await tx.shipmentJob.update({
                    where: { id },
                    data: { finalPrice: refreshed.estimatedPrice ?? null },
                });
            }
            return refreshed;
        });
        if (!updated) {
            throw new common_1.NotFoundException('Shipment not found');
        }
        return updated;
    }
    async pickupStart(id, carrierId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id } });
        if (!shipment || shipment.acceptedBy !== carrierId) {
            throw new common_1.BadRequestException('Shipment not accepted');
        }
        return this.prisma.shipmentJob.update({
            where: { id },
            data: { status: client_1.ShipmentJobStatus.PICKED_UP },
        });
    }
    async inTransit(id, carrierId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id } });
        if (!shipment || shipment.acceptedBy !== carrierId) {
            throw new common_1.BadRequestException('Shipment not accepted');
        }
        return this.prisma.shipmentJob.update({
            where: { id },
            data: { status: client_1.ShipmentJobStatus.IN_TRANSIT },
        });
    }
    async deliver(id, carrierId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id } });
        if (!shipment || shipment.acceptedBy !== carrierId) {
            throw new common_1.BadRequestException('Shipment not accepted');
        }
        const updated = await this.prisma.shipmentJob.update({
            where: { id },
            data: { status: client_1.ShipmentJobStatus.DELIVERED },
        });
        if (updated.dealId) {
            await this.prisma.deal.update({
                where: { id: updated.dealId },
                data: { status: client_1.DealStatus.CONFIRMED },
            });
        }
        if (updated.orderId) {
            await this.prisma.order.update({
                where: { id: updated.orderId },
                data: { commerceStatus: client_1.CommerceOrderStatus.COMPLETED },
            });
        }
        await this.audit.log(carrierId, 'logistics.shipment.delivered', { shipmentId: updated.id });
        return updated;
    }
    async matchAndOffer(shipmentId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id: shipmentId } });
        if (!shipment) {
            throw new common_1.NotFoundException('Shipment not found');
        }
        await this.applyPricing(shipmentId);
        const candidates = await this.matchCarriers(shipment);
        await this.prisma.shipmentJob.update({
            where: { id: shipmentId },
            data: { status: client_1.ShipmentJobStatus.OFFERED },
        });
        await this.notificationsService.createForUsers(candidates.map((c) => c.id), {
            type: 'DELIVERY_OFFER',
            title: 'Жеткізу ұсынысы',
            body: `${shipment.originAddressText ?? 'A'} → ${shipment.destAddressText ?? 'B'} | ${shipment.cargoWeightKg ?? '-'} кг, ${shipment.cargoVolumeM3 ?? '-'} м3`,
            dataJson: {
                shipmentId,
                from: shipment.originAddressText,
                to: shipment.destAddressText,
                weightKg: shipment.cargoWeightKg,
                volumeM3: shipment.cargoVolumeM3,
            },
        });
        return candidates;
    }
    async matchCarriers(shipment) {
        const cargoWeight = shipment.cargoWeightKg ?? 0;
        const cargoVolume = shipment.cargoVolumeM3 ?? 0;
        const cargoType = shipment.cargoType ?? null;
        const candidates = await this.prisma.carrierProfile.findMany({
            where: { isActive: true },
            include: { user: true },
        });
        return candidates
            .filter((carrier) => {
            const carrierRegion = carrier.user.homeRegion?.toLowerCase() ?? '';
            const pickupRegion = shipment.originRegion?.toLowerCase() ?? '';
            const dropoffRegion = shipment.destRegion?.toLowerCase() ?? '';
            if (pickupRegion || dropoffRegion) {
                const regionMatch = (pickupRegion && carrierRegion.includes(pickupRegion)) ||
                    (dropoffRegion && carrierRegion.includes(dropoffRegion)) ||
                    (carrierRegion && (pickupRegion.includes(carrierRegion) || dropoffRegion.includes(carrierRegion)));
                if (!regionMatch) {
                    return false;
                }
            }
            if (cargoWeight && carrier.maxWeightKg < cargoWeight) {
                return false;
            }
            if (cargoVolume && carrier.maxVolumeM3 && carrier.maxVolumeM3 < cargoVolume) {
                return false;
            }
            if (cargoType === 'REFRIGERATED' && !carrier.refrigerated) {
                return false;
            }
            if (cargoType === 'LIVESTOCK' && !carrier.livestockAllowed) {
                return false;
            }
            if (cargoType === 'CLOSED' && !carrier.closedBody) {
                return false;
            }
            return true;
        })
            .map((carrier) => {
            const distanceKm = this.calculateDistanceKm(carrier.user.homeLat, carrier.user.homeLng, shipment.originLat, shipment.originLng);
            const score = distanceKm ? Math.max(0, 100 - distanceKm) : 0;
            return {
                id: carrier.userId,
                displayName: carrier.user.displayName ?? carrier.user.phone ?? 'Жеткізуші',
                homeRegion: carrier.user.homeRegion ?? null,
                distanceKm,
                score,
                vehicleType: carrier.vehicleType ?? null,
                maxWeightKg: carrier.maxWeightKg,
                maxVolumeM3: carrier.maxVolumeM3 ?? null,
                refrigerated: carrier.refrigerated,
                livestockAllowed: carrier.livestockAllowed,
                closedBody: carrier.closedBody,
            };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    async applyPricing(shipmentId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id: shipmentId } });
        if (!shipment) {
            return;
        }
        const distanceKm = this.calculateDistanceKm(shipment.originLat, shipment.originLng, shipment.destLat, shipment.destLng);
        const adjustedDistance = distanceKm ? Number((distanceKm * 1.2).toFixed(2)) : null;
        const weightKg = shipment.cargoWeightKg ?? 0;
        const volumeM3 = shipment.cargoVolumeM3 ?? 0;
        const base = this.pricing.basePrice;
        const kmCost = (adjustedDistance ?? 0) * this.pricing.pricePerKm;
        const weightCost = weightKg * this.pricing.pricePerKg;
        const volumeCost = volumeM3 * this.pricing.pricePerM3;
        let subtotal = base + kmCost + weightCost + volumeCost;
        const flags = {
            refrigerated: shipment.cargoType === 'REFRIGERATED',
            livestock: shipment.cargoType === 'LIVESTOCK',
            closedBody: shipment.cargoType === 'CLOSED',
        };
        let surcharge = 0;
        if (flags.refrigerated) {
            surcharge += subtotal * this.pricing.refrigeratedSurchargePct;
        }
        if (flags.livestock) {
            surcharge += subtotal * this.pricing.livestockSurchargePct;
        }
        if (flags.closedBody) {
            surcharge += subtotal * this.pricing.closedBodySurchargePct;
        }
        const estimatedPrice = Number((subtotal + surcharge).toFixed(2));
        const pricingJson = {
            base,
            kmCost,
            weightCost,
            volumeCost,
            surcharge,
            adjustedDistance,
            flags,
            rates: this.pricing,
        };
        await this.prisma.shipmentJob.update({
            where: { id: shipmentId },
            data: {
                distanceKm: adjustedDistance ?? undefined,
                estimatedPrice,
                pricingJson: pricingJson,
            },
        });
    }
    async cancel(id, requesterId) {
        const shipment = await this.prisma.shipmentJob.findUnique({ where: { id } });
        if (!shipment || shipment.requesterId !== requesterId) {
            throw new common_1.BadRequestException('Shipment not accessible');
        }
        return this.prisma.shipmentJob.update({
            where: { id },
            data: { status: client_1.ShipmentJobStatus.CANCELLED },
        });
    }
    calculateDistanceKm(lat1, lng1, lat2, lng2) {
        if (!lat1 || !lng1 || !lat2 || !lng2) {
            return null;
        }
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Number((R * c).toFixed(2));
    }
};
exports.LogisticsService = LogisticsService;
exports.LogisticsService = LogisticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], LogisticsService);
//# sourceMappingURL=logistics.service.js.map