import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OpenTripDto } from './dto/open-trip.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { TripsService } from './trips.service';

@ApiTags('Trips')
@Controller()
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Post('trips/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async openTrip(@Req() req: Request, @Body() dto: OpenTripDto) {
    const user = req.user as { id: string };
    return this.tripsService.openTrip(user.id, dto);
  }

  @Get('trips/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listOpenTrips(@Query('routeId') routeId?: string) {
    if (!routeId) return [];
    return this.tripsService.listOpenTrips(routeId);
  }

  @Post('trips/:id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async joinTrip(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: JoinTripDto,
  ) {
    const user = req.user as { id: string };
    return this.tripsService.joinTrip(id, user.id, dto.seatCount);
  }

  @Post('trips/:id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async leaveTrip(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tripsService.leaveTrip(id, user.id);
  }

  @Post('trips/:id/closeIntent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async closeIntent(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tripsService.closeIntent(id, user.id);
  }

  @Post('trips/:id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async startTrip(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tripsService.startTrip(id, user.id);
  }

  @Post('trips/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async completeTrip(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tripsService.completeTrip(id, user.id);
  }

  @Post('trips/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async cancelTrip(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tripsService.cancelTrip(id, user.id);
  }

  @Get('me/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getActive(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.tripsService.getActiveForUser(user.id);
  }

  @Get('trips/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getTrip(@Param('id') id: string) {
    return this.tripsService.getTrip(id);
  }
}
