import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { CreateRouteTemplateDto } from './dto/create-route-template.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Routes')
@Controller('routes')
@ApiBearerAuth()
export class RoutesController {
  constructor(private routesService: RoutesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateRouteTemplateDto) {
    return this.routesService.create(dto);
  }

  @Get('from/:hubId')
  async listFromHub(@Param('hubId') hubId: string) {
    return this.routesService.listFromHub(hubId);
  }
}
