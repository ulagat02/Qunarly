import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HubsService } from './hubs.service';
import { CreateHubDto } from './dto/create-hub.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Hubs')
@Controller('hubs')
@ApiBearerAuth()
export class HubsController {
  constructor(private hubsService: HubsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateHubDto) {
    return this.hubsService.create(dto);
  }

  @Get('nearby')
  async listNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.hubsService.listNearby(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 5000,
    );
  }

  @Post(':id/request-removal')
  @UseGuards(JwtAuthGuard)
  async requestRemoval(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.hubsService.requestRemoval(user.id, id);
  }
}
