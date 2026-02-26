import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('my')
  async listMine(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.notificationsService.listForUser(userId);
  }

  @Post(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.notificationsService.markRead(userId, id);
  }

  @Patch(':id')
  async updateStatus(@Req() req: Request, @Param('id') id: string, @Body() body: { status?: string }) {
    const userId = (req.user as any)?.id;
    return this.notificationsService.updateStatus(userId, id, body?.status);
  }

  @Post('push-token')
  async updatePushToken(@Req() req: Request, @Body() body: { token?: string }) {
    const userId = (req.user as any)?.id;
    return this.notificationsService.updatePushToken(userId, body?.token ?? null);
  }
}
