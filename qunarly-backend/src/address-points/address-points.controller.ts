import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddressPointsService } from './address-points.service';
import { CreateAddressPointDto } from './dto/create-address-point.dto';

@ApiTags('address-points')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('address-points')
export class AddressPointsController {
  constructor(private addressPointsService: AddressPointsService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateAddressPointDto) {
    const userId = (req.user as any)?.id;
    return this.addressPointsService.create(userId, dto);
  }

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedRadius = radiusKm ? Number(radiusKm) : 5;
    return this.addressPointsService.search(q ?? '', parsedLat, parsedLng, parsedRadius);
  }
}
