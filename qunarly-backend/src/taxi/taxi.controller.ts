import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { EnsureRouteDto } from './dto/ensure-route.dto';
import { TaxiService } from './taxi.service';

@ApiTags('Taxi')
@Controller()
export class TaxiController {
  constructor(private taxiService: TaxiService) {}

  @Post('taxi/requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createRequest(@Req() req: Request, @Body() dto: CreateRideRequestDto) {
    const user = req.user as { id: string };
    return this.taxiService.createRequest(user.id, dto);
  }

  @Post('taxi/routes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createRoute(@Body() dto: CreateRouteDto) {
    return this.taxiService.createRoute(dto);
  }

  @Post('taxi/routes/ensure')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async ensureRoute(@Req() req: Request, @Body() dto: EnsureRouteDto) {
    const user = req.user as { id: string };
    return this.taxiService.ensureRoute(user.id, dto);
  }

  @Get('taxi/routes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listRoutes(
    @Query('origin') originVillageId?: string,
    @Query('dest') destVillageId?: string,
    @Query('mode') mode?: 'passenger' | 'driver',
  ) {
    return this.taxiService.listRoutes(originVillageId, destVillageId, mode ?? 'passenger');
  }

  @Get('taxi/requests/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRequest(@Param('id') id: string) {
    return this.taxiService.getRequest(id);
  }

  @Get('taxi/queue/drivers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async queueDrivers(@Query('routeId') routeId?: string) {
    if (!routeId) {
      return [];
    }
    return this.taxiService.listQueueDrivers(routeId);
  }

  @Post('drivers/queue/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async joinQueue(@Req() req: Request, @Body() dto: JoinQueueDto) {
    const user = req.user as { id: string };
    return this.taxiService.joinQueue(user.id, dto);
  }

  @Post('drivers/queue/ping')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async queuePing(@Req() req: Request, @Body('routeId') routeId?: string) {
    if (!routeId) {
      return null;
    }
    const user = req.user as { id: string };
    return this.taxiService.pingQueue(user.id, routeId);
  }

  @Get('drivers/queue/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async queueStatus(@Req() req: Request, @Query('routeId') routeId?: string) {
    if (!routeId) {
      return null;
    }
    const user = req.user as { id: string };
    return this.taxiService.getQueueStatus(user.id, routeId);
  }

  @Get('drivers/queue/passengers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async queuePassengers(
    @Req() req: Request,
    @Query('routeId') routeId?: string,
    @Query('expireMinutes') expireMinutes?: string,
  ) {
    if (!routeId) {
      return [];
    }
    const user = req.user as { id: string };
    const minutes = expireMinutes ? Number(expireMinutes) : 15;
    return this.taxiService.listQueuePassengers(user.id, routeId, minutes);
  }

  @Get('drivers/offers/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async pendingOffers(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.taxiService.listPendingOffers(user.id);
  }

  @Get('drivers/requests/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async activeDriverRequest(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.taxiService.getActiveDriverRequest(user.id);
  }

  @Post('drivers/offers/:offerId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async acceptOffer(
    @Req() req: Request,
    @Param('offerId') offerId: string,
    @Body() body: { actionId?: string },
  ) {
    const user = req.user as { id: string };
    return this.taxiService.acceptOffer(offerId, user.id, body?.actionId);
  }

  @Post('drivers/offers/:offerId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async rejectOffer(@Req() req: Request, @Param('offerId') offerId: string) {
    const user = req.user as { id: string };
    return this.taxiService.rejectOffer(offerId, user.id);
  }

  @Post('drivers/queue/passengers/:requestId/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async confirmQueuePassenger(@Req() req: Request, @Param('requestId') requestId: string) {
    const user = req.user as { id: string };
    return this.taxiService.confirmQueuePassenger(user.id, requestId);
  }

  @Post('drivers/queue/passengers/:requestId/skip')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async skipQueuePassenger(@Req() req: Request, @Param('requestId') requestId: string) {
    const user = req.user as { id: string };
    return this.taxiService.skipQueuePassenger(user.id, requestId);
  }

  @Post('drivers/queue/passengers/:requestId/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async removeQueuePassenger(
    @Req() req: Request,
    @Param('requestId') requestId: string,
    @Body('reason') reason: 'REMOVED_BY_DRIVER' | 'NO_SHOW',
  ) {
    const user = req.user as { id: string };
    const resolvedReason = reason ?? 'REMOVED_BY_DRIVER';
    return this.taxiService.removeConfirmedPassenger(user.id, requestId, resolvedReason);
  }

  @Post('drivers/queue/on-the-way')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async queueOnTheWay(@Req() req: Request, @Body('routeId') routeId?: string) {
    if (!routeId) {
      return null;
    }
    const user = req.user as { id: string };
    return this.taxiService.markQueueOnTheWay(user.id, routeId);
  }

  @Post('drivers/queue/inactive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async queueInactive(@Req() req: Request, @Body('routeId') routeId?: string) {
    if (!routeId) {
      return null;
    }
    const user = req.user as { id: string };
    return this.taxiService.markQueueInactive(user.id, routeId);
  }

  @Post('taxi/requests/:id/on-the-way')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async onTheWay(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.taxiService.markOnTheWay(id, user.id);
  }

  @Post('taxi/requests/:id/arrived')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async arrived(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.taxiService.markArrived(id, user.id);
  }

  @Post('taxi/requests/:id/picked-up')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async pickedUpByPassenger(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.taxiService.markPickedUpByPassenger(id, user.id);
  }

  @Post('taxi/requests/:id/ready')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async passengerReady(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.taxiService.markPassengerReady(id, user.id);
  }

  @Post('taxi/requests/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async complete(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.taxiService.completeRequest(id, user.id);
  }

  @Post('drivers/requests/:id/picked-up')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async pickedUpByDriver(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.taxiService.markPickedUpByDriver(id, user.id);
  }

  @Post('taxi/requests/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancel(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.taxiService.cancelRequest(id, user.id);
  }
}
