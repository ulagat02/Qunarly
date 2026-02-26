import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { Request } from 'express';

@Controller('logistics')
@ApiBearerAuth()
export class LogisticsController {
  private readonly logger = new Logger(LogisticsController.name);

  constructor(private logisticsService: LogisticsService) {}

  @Post('shipments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.FARMER, UserRole.ADMIN)
  async createShipment(@Req() req: Request, @Body() dto: CreateShipmentDto) {
    const user = req.user as { id: string };
    this.logger.log(`createShipment body=${JSON.stringify(req.body)}`);
    this.logger.log(`createShipment dto=${JSON.stringify(dto)}`);
    try {
      return await this.logisticsService.createShipment(user.id, dto);
    } catch (error) {
      this.logger.error('createShipment failed', error instanceof Error ? error.stack : `${error}`);
      throw error;
    }
  }

  @Get('shipments')
  @UseGuards(JwtAuthGuard)
  async listShipments() {
    return this.logisticsService.listShipments();
  }

  @Get('shipments/:id/recommendations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.FARMER, UserRole.ADMIN)
  async recommendCarriers(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.logisticsService.recommendCarriers(id, user.id);
  }

  @Post('shipments/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.FARMER, UserRole.ADMIN)
  async assignCarrier(@Req() req: Request, @Param('id') id: string, @Body() body: { carrierId: string }) {
    const user = req.user as { id: string };
    return this.logisticsService.assignCarrier(id, user.id, body.carrierId);
  }

  @Get('shipments/:id')
  async getShipment(@Param('id') id: string) {
    return this.logisticsService.getShipment(id);
  }

  @Post('shipments/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CARRIER)
  async acceptShipment(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.logisticsService.acceptShipment(id, user.id);
  }

  @Post('shipments/:id/pickup-start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CARRIER)
  async pickupStart(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.logisticsService.pickupStart(id, user.id);
  }

  @Post('shipments/:id/in-transit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CARRIER)
  async inTransit(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.logisticsService.inTransit(id, user.id);
  }

  @Post('shipments/:id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CARRIER)
  async deliver(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.logisticsService.deliver(id, user.id);
  }

  @Post('shipments/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.logisticsService.cancel(id, user.id);
  }
}
