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
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const files_service_1 = require("../files/files.service");
const notifications_service_1 = require("../notifications/notifications.service");
const orders_service_1 = require("../orders/orders.service");
let MarketService = class MarketService {
    constructor(prisma, audit, filesService, notificationsService, ordersService) {
        this.prisma = prisma;
        this.audit = audit;
        this.filesService = filesService;
        this.notificationsService = notificationsService;
        this.ordersService = ordersService;
    }
    async createListing(sellerId, dto) {
        const remoteUrls = dto.imageUrls?.length ? dto.imageUrls : dto.images;
        const seller = await this.prisma.user.findUnique({
            where: { id: sellerId },
            select: { regionId: true, districtId: true, homeLat: true, homeLng: true, homeAddressText: true },
        });
        if (!seller?.homeLat || !seller?.homeLng || !seller?.homeAddressText) {
            throw new common_1.BadRequestException('Home location is required');
        }
        const resolvedRegionId = seller?.regionId ?? undefined;
        const resolvedDistrictId = seller?.districtId ?? undefined;
        if (dto.category === 'OTHER' && !dto.customCategoryName) {
            throw new common_1.BadRequestException('Custom category name is required');
        }
        if (resolvedRegionId) {
            const region = await this.prisma.region.findUnique({ where: { id: resolvedRegionId } });
            if (!region) {
                throw new common_1.BadRequestException('Region not found');
            }
        }
        if (resolvedDistrictId) {
            const district = await this.prisma.region.findUnique({ where: { id: resolvedDistrictId } });
            if (!district) {
                throw new common_1.BadRequestException('District not found');
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
                status: client_1.ProductListingStatus.PUBLISHED,
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
        }
        else if (remoteUrls?.length) {
            const fileIds = [];
            for (const url of remoteUrls) {
                const created = await this.prisma.file.create({
                    data: {
                        ownerId: sellerId,
                        type: 'image/url',
                        url,
                        entityType: client_1.FileEntityType.LISTING_IMAGE,
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
    async listListings(filters) {
        const where = {};
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
        const orderBy = filters.sort === 'price_asc'
            ? { price: client_1.Prisma.SortOrder.asc }
            : filters.sort === 'price_desc'
                ? { price: client_1.Prisma.SortOrder.desc }
                : { createdAt: client_1.Prisma.SortOrder.desc };
        const listings = (await this.prisma.productListing.findMany({
            where,
            orderBy,
            include: {
                images: {
                    include: { file: true },
                    orderBy: { sortOrder: client_1.Prisma.SortOrder.asc },
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
        }));
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
    async getListing(id) {
        const listing = (await this.prisma.productListing.findUnique({
            where: { id },
            include: {
                images: {
                    include: { file: true },
                    orderBy: { sortOrder: client_1.Prisma.SortOrder.asc },
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
        }));
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
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
    async updateListing(id, sellerId, dto) {
        const listing = await this.prisma.productListing.findUnique({ where: { id } });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.BadRequestException('Listing not accessible');
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
    async previewListingPrice(listingId, qty) {
        const listing = await this.prisma.productListing.findUnique({
            where: { id: listingId },
            include: { priceTiers: { orderBy: { minQty: 'asc' } } },
        });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
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
    async createOffer(listingId, buyerId, dto) {
        const listing = await this.prisma.productListing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.status !== client_1.ProductListingStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Listing is not active');
        }
        const offer = await this.prisma.offer.create({
            data: {
                listingId,
                buyerId,
                unitPrice: dto.price,
                quantity: dto.quantity,
                message: dto.message,
                status: client_1.OfferStatus.SENT,
            },
        });
        await this.audit.log(buyerId, 'market.offer.sent', { offerId: offer.id });
        return offer;
    }
    async counterOffer(offerId, sellerId, dto) {
        const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer) {
            throw new common_1.NotFoundException('Offer not found');
        }
        const listing = await this.prisma.productListing.findUnique({ where: { id: offer.listingId } });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.BadRequestException('Offer does not belong to seller');
        }
        const updated = await this.prisma.offer.update({
            where: { id: offerId },
            data: {
                quantity: dto.quantity,
                unitPrice: dto.price,
                message: dto.message,
                status: client_1.OfferStatus.COUNTERED,
            },
        });
        await this.audit.log(sellerId, 'market.offer.countered', { offerId: updated.id });
        return updated;
    }
    async rejectOffer(offerId, sellerId) {
        const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer) {
            throw new common_1.NotFoundException('Offer not found');
        }
        const listing = await this.prisma.productListing.findUnique({ where: { id: offer.listingId } });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.BadRequestException('Offer does not belong to seller');
        }
        return this.prisma.offer.update({ where: { id: offerId }, data: { status: client_1.OfferStatus.REJECTED } });
    }
    normalizeTiers(tiers) {
        const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
        let lastMax = null;
        sorted.forEach((tier, idx) => {
            if (lastMax !== null && tier.minQty <= lastMax) {
                throw new common_1.BadRequestException('Tier ranges overlap');
            }
            if (tier.maxQty !== undefined && tier.maxQty < tier.minQty) {
                throw new common_1.BadRequestException('Tier maxQty must be >= minQty');
            }
            if (tier.maxQty == null && idx < sorted.length - 1) {
                throw new common_1.BadRequestException('Open-ended tier must be last');
            }
            lastMax = tier.maxQty ?? lastMax;
        });
        return sorted;
    }
    selectTier(tiers, qty) {
        const eligible = tiers.filter((tier) => qty >= tier.minQty && (tier.maxQty == null || qty <= tier.maxQty));
        if (!eligible.length)
            return null;
        return eligible.reduce((best, tier) => (tier.minQty > best.minQty ? tier : best), eligible[0]);
    }
    async acceptOffer(offerId, sellerId) {
        const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer) {
            throw new common_1.NotFoundException('Offer not found');
        }
        const listing = await this.prisma.productListing.findUnique({ where: { id: offer.listingId } });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.BadRequestException('Offer does not belong to seller');
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
            throw new common_1.BadRequestException('Seller home location is required');
        }
        if (!buyer?.homeLat || !buyer?.homeLng || !buyer?.homeAddressText) {
            throw new common_1.BadRequestException('Buyer home location is required');
        }
        await this.prisma.offer.update({
            where: { id: offerId },
            data: { status: client_1.OfferStatus.ACCEPTED },
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
                status: client_1.DealStatus.NEGOTIATING,
            },
        });
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
        await this.notificationsService.createForUsers(carriers.map((user) => user.id), {
            type: 'MARKET_ORDER_CREATED',
            title: 'Маркеттен жаңа тапсырыс',
            body: `${listing.title} бойынша жаңа relay тапсырысы құрылды.`,
            dataJson: { dealId: deal.id, orderId: order.id, listingId: listing.id },
        });
        return { ...deal, orderId: order.id };
    }
    async listDeals(userId) {
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
    async getDeal(id, userId) {
        const deal = await this.prisma.deal.findUnique({ where: { id }, include: { listing: true } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        if (deal.sellerId !== userId && deal.buyerId !== userId) {
            throw new common_1.BadRequestException('Deal not accessible');
        }
        return {
            ...deal,
            offer: {
                price: deal.agreedUnitPrice,
                quantity: deal.agreedQuantity,
            },
        };
    }
    async confirmDeal(id, userId) {
        const deal = await this.prisma.deal.findUnique({ where: { id } });
        if (!deal || (deal.sellerId !== userId && deal.buyerId !== userId)) {
            throw new common_1.BadRequestException('Deal not accessible');
        }
        return this.prisma.deal.update({
            where: { id },
            data: { status: client_1.DealStatus.CONFIRMED },
        });
    }
    async openLogistics(id) {
        const deal = await this.prisma.deal.findUnique({ where: { id } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        if (deal.status !== client_1.DealStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Deal must be confirmed before logistics');
        }
        return { allowed: true };
    }
    async listListingOffers(listingId, sellerId) {
        const listing = await this.prisma.productListing.findUnique({ where: { id: listingId } });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.BadRequestException('Listing not accessible');
        }
        return this.prisma.offer.findMany({ where: { listingId }, orderBy: { createdAt: 'desc' } });
    }
    async uploadListingImages(listingId, sellerId, files, baseUrl) {
        const listing = await this.prisma.productListing.findUnique({ where: { id: listingId } });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.BadRequestException('Listing not accessible');
        }
        const createdFiles = [];
        for (const file of files) {
            const created = await this.filesService.createUploadedFile(sellerId, file, client_1.FileEntityType.LISTING_IMAGE, listingId, baseUrl);
            createdFiles.push(created);
        }
        await this.attachListingImages(listingId, sellerId, createdFiles.map((file) => file.id));
        return this.getListing(listingId);
    }
    async attachListingImages(listingId, sellerId, fileIds) {
        const files = await this.prisma.file.findMany({ where: { id: { in: fileIds } } });
        if (files.some((file) => file.ownerId !== sellerId)) {
            throw new common_1.BadRequestException('Invalid image ownership');
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
            data: { entityType: client_1.FileEntityType.LISTING_IMAGE, entityId: listingId },
        });
    }
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        files_service_1.FilesService,
        notifications_service_1.NotificationsService,
        orders_service_1.OrdersService])
], MarketService);
//# sourceMappingURL=market.service.js.map