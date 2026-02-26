import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VillagesService } from './villages.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Community Villages')
@Controller('community-villages')
export class VillagesController {
  constructor(private villagesService: VillagesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async list(
    @Req() req: Request,
    @Query('bbox') bbox?: string,
    @Query('districtId') districtId?: string,
    @Query('q') q?: string,
  ) {
    const user = req.user as { id: string };
    if (bbox) {
      return this.villagesService.listByBounds(bbox);
    }
    if (districtId) {
      return this.villagesService.listByDistrict(districtId, user.id, q);
    }
    return [];
  }

  @Get('nearest')
  async nearest(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const parsedLat = lat ? Number(lat) : NaN;
    const parsedLng = lng ? Number(lng) : NaN;
    const parsedRadius = radiusKm ? Number(radiusKm) : 15;
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      throw new BadRequestException('lat/lng required');
    }
    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
      throw new BadRequestException('radiusKm is invalid');
    }
    return this.villagesService.findNearest(parsedLat, parsedLng, parsedRadius);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.villagesService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Req() req: Request, @Body() dto: CreateVillageDto) {
    const user = req.user as { id: string };
    return this.villagesService.create(user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async updateStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'PENDING' | 'REJECTED') {
    return this.villagesService.updateStatus(id, status);
  }
}
