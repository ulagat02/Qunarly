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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MarketController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const market_service_1 = require("./market.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
const client_1 = require("@prisma/client");
const create_listing_dto_1 = require("./dto/create-listing.dto");
const update_listing_dto_1 = require("./dto/update-listing.dto");
const create_offer_dto_1 = require("./dto/create-offer.dto");
const counter_offer_dto_1 = require("./dto/counter-offer.dto");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const fs = require("fs");
const path = require("path");
let MarketController = MarketController_1 = class MarketController {
    constructor(marketService) {
        this.marketService = marketService;
        this.logger = new common_1.Logger(MarketController_1.name);
    }
    async createListing(req, dto) {
        const user = req.user;
        this.logger.log(`createListing body=${JSON.stringify(req.body)}`);
        this.logger.log(`createListing dto=${JSON.stringify(dto)}`);
        try {
            return await this.marketService.createListing(user.id, dto);
        }
        catch (error) {
            this.logger.error('createListing failed', error instanceof Error ? error.stack : `${error}`);
            throw error;
        }
    }
    async listListings(search, category, regionId, districtId, minPrice, maxPrice, sort) {
        return this.marketService.listListings({
            search,
            category,
            regionId,
            districtId,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort,
        });
    }
    async getListing(id) {
        return this.marketService.getListing(id);
    }
    async previewListing(id, qty) {
        const parsedQty = qty ? Number(qty) : 0;
        if (!parsedQty || parsedQty <= 0) {
            return this.marketService.previewListingPrice(id, 1);
        }
        return this.marketService.previewListingPrice(id, parsedQty);
    }
    async updateListing(id, req, dto) {
        const user = req.user;
        return this.marketService.updateListing(id, user.id, dto);
    }
    async uploadImages(listingId, req) {
        const user = req.user;
        const files = req.files;
        if (!files || files.length === 0) {
            return this.marketService.getListing(listingId);
        }
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return this.marketService.uploadListingImages(listingId, user.id, files, baseUrl);
    }
    async createOffer(listingId, req, dto) {
        const user = req.user;
        return this.marketService.createOffer(listingId, user.id, dto);
    }
    async acceptOffer(offerId, req) {
        const user = req.user;
        return this.marketService.acceptOffer(offerId, user.id);
    }
    async counterOffer(offerId, req, dto) {
        const user = req.user;
        return this.marketService.counterOffer(offerId, user.id, dto);
    }
    async rejectOffer(offerId, req) {
        const user = req.user;
        return this.marketService.rejectOffer(offerId, user.id);
    }
    async listListingOffers(listingId, req) {
        const user = req.user;
        return this.marketService.listListingOffers(listingId, user.id);
    }
    async listDeals(req) {
        const user = req.user;
        return this.marketService.listDeals(user.id);
    }
    async getDeal(id, req) {
        const user = req.user;
        return this.marketService.getDeal(id, user.id);
    }
    async confirmDeal(id, req) {
        const user = req.user;
        return this.marketService.confirmDeal(id, user.id);
    }
    async openLogistics(id) {
        return this.marketService.openLogistics(id);
    }
};
exports.MarketController = MarketController;
__decorate([
    (0, common_1.Post)('listings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_listing_dto_1.CreateListingDto]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "createListing", null);
__decorate([
    (0, common_1.Get)('listings'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('regionId')),
    __param(3, (0, common_1.Query)('districtId')),
    __param(4, (0, common_1.Query)('minPrice')),
    __param(5, (0, common_1.Query)('maxPrice')),
    __param(6, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "listListings", null);
__decorate([
    (0, common_1.Get)('listings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getListing", null);
__decorate([
    (0, common_1.Get)('listings/:id/preview'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('qty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "previewListing", null);
__decorate([
    (0, common_1.Patch)('listings/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_listing_dto_1.UpdateListingDto]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "updateListing", null);
__decorate([
    (0, common_1.Post)('listings/:id/images'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => {
                const uploadPath = path.join(process.cwd(), 'uploads');
                fs.mkdirSync(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (_req, file, cb) => {
                const ext = path.extname(file.originalname);
                const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
                cb(null, name);
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "uploadImages", null);
__decorate([
    (0, common_1.Post)('listings/:id/offers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_offer_dto_1.CreateOfferDto]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "createOffer", null);
__decorate([
    (0, common_1.Post)('offers/:id/accept'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "acceptOffer", null);
__decorate([
    (0, common_1.Post)('offers/:id/counter'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, counter_offer_dto_1.CounterOfferDto]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "counterOffer", null);
__decorate([
    (0, common_1.Post)('offers/:id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "rejectOffer", null);
__decorate([
    (0, common_1.Get)('listings/:id/offers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.FARMER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "listListingOffers", null);
__decorate([
    (0, common_1.Get)('deals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "listDeals", null);
__decorate([
    (0, common_1.Get)('deals/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getDeal", null);
__decorate([
    (0, common_1.Post)('deals/:id/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "confirmDeal", null);
__decorate([
    (0, common_1.Post)('deals/:id/open-logistics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "openLogistics", null);
exports.MarketController = MarketController = MarketController_1 = __decorate([
    (0, common_1.Controller)('market'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], MarketController);
//# sourceMappingURL=market.controller.js.map