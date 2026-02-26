import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('regions')
@ApiBearerAuth()
export class RegionsController {
  constructor(private regionsService: RegionsService) {}

  @Get()
  async list() {
    return this.regionsService.list();
  }

  @Get('districts')
  async listDistricts(@Query('regionId') regionId?: string) {
    if (!regionId) {
      throw new BadRequestException('regionId is required');
    }
    return this.regionsService.listDistricts(regionId);
  }


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateRegionDto) {
    return this.regionsService.create(dto);
  }
}
