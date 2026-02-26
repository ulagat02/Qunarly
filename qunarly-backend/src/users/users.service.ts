import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductListingStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ include: { profile: true } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { profile: true } });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        region: true,
        district: true,
        settlement: true,
        profile: { include: { avatarFile: true } },
      },
    });
    if (!user || !user.publicProfile || user.role !== UserRole.FARMER) {
      throw new NotFoundException('Public profile not found');
    }
    const listings =
      (await this.prisma.productListing.findMany({
      where: { sellerId: userId, status: ProductListingStatus.PUBLISHED },
      orderBy: { createdAt: Prisma.SortOrder.desc },
      include: {
        images: {
          include: { file: true },
          orderBy: { sortOrder: Prisma.SortOrder.asc },
        },
      },
    })) as Prisma.ProductListingGetPayload<{
      include: { images: { include: { file: true } } };
    }>[];
    const displayName = user.displayName ?? user.profile?.name ?? 'Фермер';
    const avatarUrl = user.avatarUrl ?? user.profile?.avatarFile?.url ?? null;
    return {
      id: user.id,
      displayName,
      avatarUrl,
      bio: user.bio ?? null,
      region: {
        regionId: user.regionId ?? null,
        regionName: user.region?.name ?? null,
        districtId: user.districtId ?? null,
        districtName: user.district?.name ?? null,
        settlementId: user.settlementId ?? null,
        settlementName: user.settlement?.nameDisplay ?? null,
      },
      ratingStats: user.ratingStats ?? { rating: 0, reviewsCount: 0 },
      listings: listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        quantity: listing.quantity,
        unit: listing.unit,
        price: listing.price,
        currency: listing.currency,
        coverImageUrl: listing.images[0]?.file.url ?? null,
      })),
    };
  }
}
