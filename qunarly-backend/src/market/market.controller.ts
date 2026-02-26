import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Controller('market')
@ApiBearerAuth()
export class MarketController {
  private readonly logger = new Logger(MarketController.name);

  constructor(private marketService: MarketService) {}

  @Post('listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async createListing(@Req() req: Request, @Body() dto: CreateListingDto) {
    const user = req.user as { id: string };
    this.logger.log(`createListing body=${JSON.stringify(req.body)}`);
    this.logger.log(`createListing dto=${JSON.stringify(dto)}`);
    try {
      return await this.marketService.createListing(user.id, dto);
    } catch (error) {
      this.logger.error('createListing failed', error instanceof Error ? error.stack : `${error}`);
      throw error;
    }
  }

  @Get('listings')
  async listListings(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('regionId') regionId?: string,
    @Query('districtId') districtId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: 'latest' | 'price_asc' | 'price_desc',
  ) {
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

  @Get('listings/:id')
  async getListing(@Param('id') id: string) {
    return this.marketService.getListing(id);
  }

  @Get('listings/:id/preview')
  async previewListing(@Param('id') id: string, @Query('qty') qty?: string) {
    const parsedQty = qty ? Number(qty) : 0;
    if (!parsedQty || parsedQty <= 0) {
      return this.marketService.previewListingPrice(id, 1);
    }
    return this.marketService.previewListingPrice(id, parsedQty);
  }

  @Patch('listings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async updateListing(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateListingDto) {
    const user = req.user as { id: string };
    return this.marketService.updateListing(id, user.id, dto);
  }

  @Post('listings/:id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          const uploadPath = path.join(process.cwd(), 'uploads');
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ext = path.extname(file.originalname);
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImages(@Param('id') listingId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    const files = (req as Request & { files?: Express.Multer.File[] }).files;
    if (!files || files.length === 0) {
      return this.marketService.getListing(listingId);
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.marketService.uploadListingImages(listingId, user.id, files, baseUrl);
  }

  @Post('listings/:id/offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  async createOffer(@Param('id') listingId: string, @Req() req: Request, @Body() dto: CreateOfferDto) {
    const user = req.user as { id: string };
    return this.marketService.createOffer(listingId, user.id, dto);
  }

  @Post('offers/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async acceptOffer(@Param('id') offerId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.marketService.acceptOffer(offerId, user.id);
  }

  @Post('offers/:id/counter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async counterOffer(@Param('id') offerId: string, @Req() req: Request, @Body() dto: CounterOfferDto) {
    const user = req.user as { id: string };
    return this.marketService.counterOffer(offerId, user.id, dto);
  }

  @Post('offers/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async rejectOffer(@Param('id') offerId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.marketService.rejectOffer(offerId, user.id);
  }

  @Get('listings/:id/offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async listListingOffers(@Param('id') listingId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.marketService.listListingOffers(listingId, user.id);
  }

  @Get('deals')
  @UseGuards(JwtAuthGuard)
  async listDeals(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.marketService.listDeals(user.id);
  }

  @Get('deals/:id')
  @UseGuards(JwtAuthGuard)
  async getDeal(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.marketService.getDeal(id, user.id);
  }

  @Post('deals/:id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmDeal(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.marketService.confirmDeal(id, user.id);
  }

  @Post('deals/:id/open-logistics')
  @UseGuards(JwtAuthGuard)
  async openLogistics(@Param('id') id: string) {
    return this.marketService.openLogistics(id);
  }
}
