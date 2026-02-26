import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateAddressPointDto } from './dto/create-address-point.dto';

type AddressPointItem = {
  id: string;
  lat: number;
  lng: number;
  street: string | null;
  houseNumber: string | null;
  locality: string | null;
  confirmCount: number;
};

const toRad = (value: number) => (value * Math.PI) / 180;

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

@Injectable()
export class AddressPointsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressPointDto) {
    const nearby = await this.findNearby(dto.lat, dto.lng, 0.03);
    const match = nearby.find((item) => {
      const streetMatches =
        dto.street && item.street?.toLowerCase() === dto.street.toLowerCase();
      const houseMatches = dto.houseNumber && item.houseNumber === dto.houseNumber;
      return Boolean(streetMatches || houseMatches);
    });
    if (match) {
      return this.prisma.addressPoint.update({
        where: { id: match.id },
        data: { confirmCount: { increment: 1 } },
      });
    }
    return this.prisma.addressPoint.create({
      data: {
        userId,
        lat: dto.lat,
        lng: dto.lng,
        street: dto.street,
        houseNumber: dto.houseNumber,
        locality: dto.locality,
        source: 'user_contributed',
      },
    });
  }

  async search(q: string, lat: number, lng: number, radiusKm: number) {
    const normalized = q.trim().toLowerCase();
    const items = await this.findNearby(lat, lng, radiusKm);
    const filtered = normalized
      ? items.filter((item) => {
          const hay = `${item.street ?? ''} ${item.houseNumber ?? ''} ${item.locality ?? ''}`.toLowerCase();
          return hay.includes(normalized);
        })
      : items;
    const streetCounts = filtered.reduce<Record<string, number>>((acc, item) => {
      const key = (item.street ?? item.locality ?? '').toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return filtered.map((item) => ({
      ...item,
      streetCount: item.street ? streetCounts[item.street.toLowerCase()] ?? 1 : undefined,
    }));
  }

  private async findNearby(lat: number, lng: number, radiusKm: number): Promise<AddressPointItem[]> {
    const delta = radiusKm / 111;
    const candidates: AddressPointItem[] = await this.prisma.addressPoint.findMany({
      where: {
        lat: { gte: lat - delta, lte: lat + delta },
        lng: { gte: lng - delta, lte: lng + delta },
      },
      orderBy: { confirmCount: 'desc' },
      take: 50,
    });
    return candidates.filter((item) => haversineKm({ lat, lng }, { lat: item.lat, lng: item.lng }) <= radiusKm);
  }
}
