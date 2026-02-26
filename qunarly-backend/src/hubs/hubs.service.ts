import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { NotificationsService } from '../notifications/notifications.service';

const toRad = (value: number) => (value * Math.PI) / 180;

export const haversineDistanceM = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

@Injectable()
export class HubsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateHubDto) {
    const nearby = await this.listNearby(dto.lat, dto.lng, 5000);
    if (nearby.length > 0) {
      throw new BadRequestException('Бұл радиуста хаб бар (5км)');
    }
    return this.prisma.hub.create({
      data: {
        name: dto.name.trim(),
        normalizedName: this.normalizeName(dto.name),
        lat: dto.lat,
        lng: dto.lng,
        radiusKm: dto.radiusKm ?? 0.8,
        isActive: dto.isActive ?? true,
        regionId: dto.regionId ?? null,
        districtId: dto.districtId ?? null,
      },
    });
  }

  async listNearby(lat: number, lng: number, radiusMeters = 5000) {
    // Basic bounding box filter for performance before Haversine
    const deltaLat = radiusMeters / 111000;
    const deltaLng = radiusMeters / (111000 * Math.cos(toRad(lat)));

    const candidates = await this.prisma.hub.findMany({
      where: {
        lat: { gte: lat - deltaLat, lte: lat + deltaLat },
        lng: { gte: lng - deltaLng, lte: lng + deltaLng },
        isActive: true,
      },
    });

    return candidates
      .map((hub) => ({
        ...hub,
        distanceM: haversineDistanceM(lat, lng, hub.lat, hub.lng),
      }))
      .filter((hub) => hub.distanceM <= radiusMeters)
      .sort((a, b) => a.distanceM - b.distanceM);
  }

  async findNearest(lat: number, lng: number) {
    const nearby = await this.listNearby(lat, lng, 20000); // Check up to 20km
    return nearby[0] || null;
  }

  async getById(id: string) {
    return this.prisma.hub.findUnique({ where: { id } });
  }

  async requestRemoval(userId: string, hubId: string) {
    const hub = await this.prisma.hub.findUnique({ where: { id: hubId } });
    if (!hub) {
      throw new NotFoundException('Hub not found');
    }
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    await this.notificationsService.createForUsers(
      admins.map((user) => user.id),
      {
        type: 'HUB_REMOVAL_REQUEST',
        title: 'Хабты жою сұранысы',
        body: `${hub.name} хабын жою туралы сұраныс түсті.`,
        dataJson: { hubId: hub.id, hubName: hub.name, requesterId: userId },
      },
    );
    return { ok: true };
  }

  private normalizeName(name: string) {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
