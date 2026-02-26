import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { DeliveryService } from './delivery.service';

@ApiTags('deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private deliveryService: DeliveryService) {}

  @Get(':id/drivers')
  async listDrivers(@Param('id') id: string, @Query('type') type?: string) {
    return this.deliveryService.listDriversForDelivery(id, type);
  }
}
