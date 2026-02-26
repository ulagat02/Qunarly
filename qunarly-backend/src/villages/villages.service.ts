import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateVillageDto } from './dto/create-village.dto';

const normalizeVillageName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();
const toRad = (value: number) => (value * Math.PI) / 180;
const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

@Injectable()
export class VillagesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateVillageDto) {
    const nameDisplay = dto.nameDisplay.trim().replace(/\s+/g, ' ');
    const nameNormalized = nameDisplay.toLowerCase();
    if (nameDisplay.length < 2) {
      throw new BadRequestException('Village name too short');
    }

    const existing = await this.prisma.communityVillage.findFirst({
      where: {
        nameNormalized,
        districtId: dto.districtId,
      },
    });
    if (existing) {
      return existing;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const createdToday = await this.prisma.communityVillage.count({
      where: {
        createdByUserId: userId,
        createdAt: { gte: startOfDay },
      },
    });
    if (createdToday >= 2) {
      throw new BadRequestException('Daily village creation limit reached');
    }

    const region = await this.prisma.region.findUnique({ where: { id: dto.regionId } });
    const district = await this.prisma.district.findUnique({ where: { id: dto.districtId } });
    if (!region) {
      throw new BadRequestException('Region not found');
    }
    if (!district) {
      throw new BadRequestException('District not found');
    }
    if (district.regionId !== dto.regionId) {
      throw new BadRequestException('District does not belong to region');
    }

    return this.prisma.communityVillage.create({
      data: {
        nameDisplay,
        nameNormalized,
        regionId: dto.regionId,
        districtId: dto.districtId,
        lat: dto.lat,
        lng: dto.lng,
        createdByUserId: userId,
        status: 'PENDING',
      },
    });
  }

  async listByBounds(bbox: string) {
    const parts = bbox.split(',').map((value) => Number(value));
    if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
      throw new BadRequestException('Invalid bbox');
    }
    const [west, south, east, north] = parts;
    return this.prisma.communityVillage.findMany({
      where: {
        lat: { gte: south, lte: north },
        lng: { gte: west, lte: east },
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNearest(lat: number, lng: number, radiusKm = 15) {
    const deltaLat = radiusKm / 111;
    const deltaLng = radiusKm / (111 * Math.cos(toRad(lat)));
    const candidates = await this.prisma.communityVillage.findMany({
      where: {
        lat: { gte: lat - deltaLat, lte: lat + deltaLat },
        lng: { gte: lng - deltaLng, lte: lng + deltaLng },
        status: 'ACTIVE',
      },
    });
    let nearest: (typeof candidates)[number] | null = null;
    let nearestDist = Infinity;
    for (const candidate of candidates) {
      const distance = haversineKm({ lat, lng }, { lat: candidate.lat, lng: candidate.lng });
      if (distance <= radiusKm && distance < nearestDist) {
        nearest = candidate;
        nearestDist = distance;
      }
    }
    return nearest ? { ...nearest, distanceKm: nearestDist } : null;
  }

  async listByDistrict(districtId: string, userId?: string, q?: string) {
    const normalizedQ = q ? q.trim().toLowerCase().replace(/\s+/g, ' ') : undefined;
    return this.prisma.communityVillage.findMany({
      where: {
        districtId,
        ...(normalizedQ ? { nameNormalized: { contains: normalizedQ } } : {}),
        OR: [
          { status: { in: ['ACTIVE', 'APPROVED'] } },
          ...(userId ? [{ createdByUserId: userId }] : []),
        ],
      },
      orderBy: { nameDisplay: 'asc' },
    });
  }

  async getById(id: string) {
    return this.prisma.communityVillage.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'PENDING' | 'REJECTED') {
    return this.prisma.communityVillage.update({
      where: { id },
      data: { status },
    });
  }
}
