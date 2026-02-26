import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { DeliveryService } from './delivery.service';
import { DriverLocationDto } from './dto/driver-location.dto';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private deliveryService: DeliveryService) {}

  @Post('location')
  @Roles('CARRIER')
  async updateLocation(@Req() req: Request, @Body() dto: DriverLocationDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.updateDriverLocation(userId, dto);
  }
}
