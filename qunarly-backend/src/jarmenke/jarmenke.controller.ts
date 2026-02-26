import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { JarmenkeService } from './jarmenke.service';
import { CreateJarmenkeEventDto } from './dto/create-event.dto';

@ApiTags('jarmenke')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jarmenke')
export class JarmenkeController {
  constructor(private jarmenkeService: JarmenkeService) {}

  @Post('events')
  @Roles(UserRole.ADMIN)
  async createEvent(@Body() dto: CreateJarmenkeEventDto) {
    return this.jarmenkeService.createEvent(dto);
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  async analytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.jarmenkeService.getAnalytics(from, to);
  }
}
