import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { DealStatus, OfferStatus, ProductListingStatus, FileEntityType, Prisma } from '@prisma/client';
import { FilesService } from '../files/files.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { PriceTierDto } from './dto/price-tier.dto';

@Injectable()
export class MarketService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private filesService: FilesService,
    private notificationsService: NotificationsService,
    private ordersService: OrdersService,
  ) {}

  async createListing(sellerId: string, dto: CreateListingDto) {
    const remoteUrls = dto.imageUrls?.length ? dto.imageUrls : dto.images;
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { regionId: true, districtId: true, homeLat: true, homeLng: true, homeAddressText: true },
    });
    if (!seller?.homeLat || !seller?.homeLng || !seller?.homeAddressText) {
      throw new BadRequestException('Home location is required');
    }
    const resolvedRegionId = seller?.regionId ?? undefined;
    const resolvedDistrictId = seller?.districtId ?? undefined;

    if (dto.category === 'OTHER' && !dto.customCategoryName) {
      throw new BadRequestException('Custom category name is required');
    }

    if (resolvedRegionId) {
      const region = await this.prisma.region.findUnique({ where: { id: resolvedRegionId } });
      if (!region) {
        throw new BadRequestException('Region not found');
      }
    }
    if (resolvedDistrictId) {
      const district = await this.prisma.region.findUnique({ where: { id: resolvedDistrictId } });
      if (!district) {
        throw new BadRequestException('District not found');
      }
    }
    const listing = await this.prisma.productListing.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        customCategoryName: dto.customCategoryName,
        quantity: dto.quantity,
        unit: dto.unit,
        price: dto.price,
        priceType: dto.priceType,
        currency: dto.currency,
        regionId: resolvedRegionId,
        districtId: resolvedDistrictId,
        addressText: dto.addressText,
        status: ProductListingStatus.PUBLISHED,
      },
    });
    if (dto.tiers?.length) {
      const tiers = this.normalizeTiers(dto.tiers);
      await this.prisma.productPriceTier.createMany({
        data: tiers.map((tier) => ({
          productListingId: listing.id,
          minQty: tier.minQty,
          maxQty: tier.maxQty ?? undefined,
          unitPrice: tier.unitPrice,
          currency: tier.currency,
        })),
      });
    }
    if (dto.imageFileIds?.length) {
      await this.attachListingImages(listing.id, sellerId, dto.imageFileIds);
    } else if (remoteUrls?.length) {
      const fileIds: string[] = [];
      for (const url of remoteUrls) {
        const created = await this.prisma.file.create({
          data: {
            ownerId: sellerId,
            type: 'image/url',
            url,
            entityType: FileEntityType.LISTING_IMAGE,
            entityId: listing.id,
          },
        });
        fileIds.push(created.id);
      }
      if (fileIds.length) {
        await this.attachListingImages(listing.id, sellerId, fileIds);
      }
    }
    await this.audit.log(sellerId, 'market.listing.created', { listingId: listing.id });
    return this.getListing(listing.id);
  }

  async listListings(filters: {
    search?: string;
    category?: string;
    regionId?: string;
    districtId?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'latest' | 'price_asc' | 'price_desc';
  }) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.regionId) {
      where.regionId = filters.regionId;
    }
    if (filters.districtId) {
      where.districtId = filters.districtId;
    }
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }
    const orderBy: Prisma.ProductListingOrderByWithRelationInput =
      filters.sort === 'price_asc'
        ? { price: Prisma.SortOrder.asc }
        : filters.sort === 'price_desc'
        ? { price: Prisma.SortOrder.desc }
        : { createdAt: Prisma.SortOrder.desc };
    const listings =
      (await this.prisma.productListing.findMany({
      where,
      orderBy,
      include: {
        images: {
          include: { file: true },
          orderBy: { sortOrder: Prisma.SortOrder.asc },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            profile: {
              select: { name: true, avatarFile: { select: { url: true } } },
            },
          },
        },
      },
    })) as Prisma.ProductListingGetPayload<{
      include: {
        images: { include: { file: true } };
        seller: {
          select: {
            id: true;
            displayName: true;
            avatarUrl: true;
            profile: { select: { name: true; avatarFile: { select: { url: true } } } };
          };
        };
      };
    }>[];
    return listings.map((listing) => ({
      ...listing,
      regionId: listing.regionId ?? null,
      districtId: listing.districtId ?? null,
      imageUrls: listing.images.map((image) => image.file.url),
      coverImageUrl: listing.images[0]?.file.url ?? null,
      seller: listing.seller
        ? {
            id: listing.seller.id,
            displayName: listing.seller.displayName ?? listing.seller.profile?.name ?? 'Фермер',
            avatarUrl: listing.seller.avatarUrl ?? listing.seller.profile?.avatarFile?.url ?? null,
          }
        : null,
    }));
  }

  async getListing(id: string) {
    const listing = (await this.prisma.productListing.findUnique({
      where: { id },
      include: {
        images: {
          include: { file: true },
          orderBy: { sortOrder: Prisma.SortOrder.asc },
        },
        priceTiers: {
          orderBy: { minQty: 'asc' },
        },
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            profile: {
              select: { name: true, avatarFile: { select: { url: true } } },
            },
          },
        },
      },
    })) as Prisma.ProductListingGetPayload<{
      include: {
        images: { include: { file: true } };
        seller: {
          select: {
            id: true;
            displayName: true;
            avatarUrl: true;
            profile: { select: { name: true; avatarFile: { select: { url: true } } } };
          };
        };
      };
    }> | null;
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return {
      ...listing,
      regionId: listing.regionId ?? null,
      districtId: listing.districtId ?? null,
      imageUrls: listing.images.map((image) => image.file.url),
      coverImageUrl: listing.images[0]?.file.url ?? null,
      seller: listing.seller
        ? {
            id: listing.seller.id,
            displayName: listing.seller.displayName ?? listing.seller.profile?.name ?? 'Фермер',
            avatarUrl: listing.seller.avatarUrl ?? listing.seller.profile?.avatarFile?.url ?? null,
          }
        : null,
    };
  }

  async updateListing(id: string, sellerId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.productListing.findUnique({ where: { id } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new BadRequestException('Listing not accessible');
    }
    const { imageFileIds, imageUrls, images, tiers, ...data } = dto;
    const updated = await this.prisma.productListing.update({ where: { id }, data });
    if (imageFileIds) {
      await this.prisma.listingImage.deleteMany({ where: { listingId: id } });
      await this.attachListingImages(id, sellerId, imageFileIds);
    }
    if (tiers) {
      const normalized = this.normalizeTiers(tiers);
      await this.prisma.productPriceTier.deleteMany({ where: { productListingId: id } });
      if (normalized.length) {
        await this.prisma.productPriceTier.createMany({
          data: normalized.map((tier) => ({
            productListingId: id,
            minQty: tier.minQty,
            maxQty: tier.maxQty ?? undefined,
            unitPrice: tier.unitPrice,
            currency: tier.currency,
          })),
        });
      }
    }
    return this.getListing(updated.id);
  }

  async previewListingPrice(listingId: string, qty: number) {
    const listing = await this.prisma.productListing.findUnique({
      where: { id: listingId },
      include: { priceTiers: { orderBy: { minQty: 'asc' } } },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    const tier = this.selectTier(listing.priceTiers, qty);
    return {
      listingId,
      qty,
      appliedTierId: tier?.id ?? null,
      unitPrice: tier?.unitPrice ?? listing.price,
      currency: tier?.currency ?? listing.currency,
    };
  }

  async createOffer(listingId: string, buyerId: string, dto: CreateOfferDto) {
    const listing = await this.prisma.productListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.status !== ProductListingStatus.PUBLISHED) {
      throw new BadRequestException('Listing is not active');
    }
    const offer = await this.prisma.offer.create({
      data: {
        listingId,
        buyerId,
        unitPrice: dto.price,
        quantity: dto.quantity,
        message: dto.message,
        status: OfferStatus.SENT,
      },
    });
    await this.audit.log(buyerId, 'market.offer.sent', { offerId: offer.id });
    return offer;
  }

  async counterOffer(offerId: string, sellerId: string, dto: CounterOfferDto) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    const listing = await this.prisma.productListing.findUnique({ where: { id: offer.listingId } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new BadRequestException('Offer does not belong to seller');
    }
    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        quantity: dto.quantity,
        unitPrice: dto.price,
        message: dto.message,
        status: OfferStatus.COUNTERED,
      },
    });
    await this.audit.log(sellerId, 'market.offer.countered', { offerId: updated.id });
    return updated;
  }

  async rejectOffer(offerId: string, sellerId: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    const listing = await this.prisma.productListing.findUnique({ where: { id: offer.listingId } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new BadRequestException('Offer does not belong to seller');
    }
    return this.prisma.offer.update({ where: { id: offerId }, data: { status: OfferStatus.REJECTED } });
  }

  private normalizeTiers(tiers: PriceTierDto[]) {
    const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
    let lastMax: number | null = null;
    sorted.forEach((tier, idx) => {
      if (lastMax !== null && tier.minQty <= lastMax) {
        throw new BadRequestException('Tier ranges overlap');
      }
      if (tier.maxQty !== undefined && tier.maxQty < tier.minQty) {
        throw new BadRequestException('Tier maxQty must be >= minQty');
      }
      if (tier.maxQty == null && idx < sorted.length - 1) {
        throw new BadRequestException('Open-ended tier must be last');
      }
      lastMax = tier.maxQty ?? lastMax;
    });
    return sorted;
  }

  private selectTier(tiers: { id: string; minQty: number; maxQty: number | null; unitPrice: number; currency: string }[], qty: number) {
    const eligible = tiers.filter((tier) => qty >= tier.minQty && (tier.maxQty == null || qty <= tier.maxQty));
    if (!eligible.length) return null;
    return eligible.reduce((best, tier) => (tier.minQty > best.minQty ? tier : best), eligible[0]);
  }

  async acceptOffer(offerId: string, sellerId: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    const listing = await this.prisma.productListing.findUnique({ where: { id: offer.listingId } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new BadRequestException('Offer does not belong to seller');
    }
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { homeLat: true, homeLng: true, homeAddressText: true, homeRegion: true },
    });
    const buyer = await this.prisma.user.findUnique({
      where: { id: offer.buyerId },
      select: { homeLat: true, homeLng: true, homeAddressText: true, homeRegion: true },
    });
    if (!seller?.homeLat || !seller?.homeLng || !seller?.homeAddressText) {
      throw new BadRequestException('Seller home location is required');
    }
    if (!buyer?.homeLat || !buyer?.homeLng || !buyer?.homeAddressText) {
      throw new BadRequestException('Buyer home location is required');
    }
    await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.ACCEPTED },
    });
    const deal = await this.prisma.deal.create({
      data: {
        listingId: listing.id,
        sellerId,
        buyerId: offer.buyerId,
        agreedQuantity: offer.quantity,
        agreedUnitPrice: offer.unitPrice,
        cargoWeightKg: offer.quantity,
        cargoVolumeM3: 1,
        cargoType: listing.category,
        pickupLat: seller.homeLat,
        pickupLng: seller.homeLng,
        pickupAddressText: seller.homeAddressText,
        pickupRegion: seller.homeRegion,
        dropoffLat: buyer.homeLat,
        dropoffLng: buyer.homeLng,
        dropoffAddressText: buyer.homeAddressText,
        dropoffRegion: buyer.homeRegion,
        status: DealStatus.NEGOTIATING,
      },
    });
    // Canonical flow: accepted offer → order + delivery legs (no separate ShipmentJob).
    const order = await this.ordersService.createOrder(offer.buyerId, {
      idempotencyKey: `deal-${deal.id}`,
      listingId: listing.id,
      quantity: offer.quantity,
      destinationText: buyer.homeAddressText,
      destLat: buyer.homeLat,
      destLng: buyer.homeLng,
    });
    await this.audit.log(sellerId, 'market.deal.created', { dealId: deal.id });
    const carriers = await this.prisma.user.findMany({
      where: { role: 'CARRIER', status: 'ACTIVE' },
      select: { id: true },
    });
    await this.notificationsService.createForUsers(
      carriers.map((user) => user.id),
      {
        type: 'MARKET_ORDER_CREATED',
        title: 'Маркеттен жаңа тапсырыс',
        body: `${listing.title} бойынша жаңа relay тапсырысы құрылды.`,
        dataJson: { dealId: deal.id, orderId: order.id, listingId: listing.id },
      },
    );
    return { ...deal, orderId: order.id };
  }

  async listDeals(userId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { OR: [{ sellerId: userId }, { buyerId: userId }] },
      include: { listing: true },
    });
    return deals.map((deal) => ({
      ...deal,
      offer: {
        price: deal.agreedUnitPrice,
        quantity: deal.agreedQuantity,
      },
    }));
  }

  async getDeal(id: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id }, include: { listing: true } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    if (deal.sellerId !== userId && deal.buyerId !== userId) {
      throw new BadRequestException('Deal not accessible');
    }
    return {
      ...deal,
      offer: {
        price: deal.agreedUnitPrice,
        quantity: deal.agreedQuantity,
      },
    };
  }

  async confirmDeal(id: string, userId: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal || (deal.sellerId !== userId && deal.buyerId !== userId)) {
      throw new BadRequestException('Deal not accessible');
    }
    return this.prisma.deal.update({
      where: { id },
      data: { status: DealStatus.CONFIRMED },
    });
  }

  async openLogistics(id: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    if (deal.status !== DealStatus.CONFIRMED) {
      throw new BadRequestException('Deal must be confirmed before logistics');
    }
    return { allowed: true };
  }

  async listListingOffers(listingId: string, sellerId: string) {
    const listing = await this.prisma.productListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new BadRequestException('Listing not accessible');
    }
    return this.prisma.offer.findMany({ where: { listingId }, orderBy: { createdAt: 'desc' } });
  }

  async uploadListingImages(
    listingId: string,
    sellerId: string,
    files: Express.Multer.File[],
    baseUrl?: string,
  ) {
    const listing = await this.prisma.productListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new BadRequestException('Listing not accessible');
    }
    const createdFiles = [];
    for (const file of files) {
      const created = await this.filesService.createUploadedFile(
        sellerId,
        file,
        FileEntityType.LISTING_IMAGE,
        listingId,
        baseUrl,
      );
      createdFiles.push(created);
    }
    await this.attachListingImages(
      listingId,
      sellerId,
      createdFiles.map((file) => file.id),
    );
    return this.getListing(listingId);
  }

  private async attachListingImages(listingId: string, sellerId: string, fileIds: string[]) {
    const files = await this.prisma.file.findMany({ where: { id: { in: fileIds } } });
    if (files.some((file) => file.ownerId !== sellerId)) {
      throw new BadRequestException('Invalid image ownership');
    }
    await this.prisma.listingImage.createMany({
      data: fileIds.map((fileId, index) => ({
        listingId,
        fileId,
        sortOrder: index,
      })),
    });
    await this.prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { entityType: FileEntityType.LISTING_IMAGE, entityId: listingId },
    });
  }
}
