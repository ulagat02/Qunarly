import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { DeliveryService } from './delivery.service';
import {
  ArriveLegDto,
  DropPickDropDto,
  DropPickPickupDto,
  HandoffAckDto,
  HandoffCompleteDto,
  HandoffConfirmDto,
  ProofEventsBatchDto,
} from './dto';

@ApiTags('delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get('legs/available')
  @Roles('CARRIER')
  async listAvailable(@Query('regionText') regionText?: string) {
    return this.deliveryService.listAvailable(regionText);
  }

  @Get('legs/mine')
  @Roles('CARRIER')
  async listMine(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.listMine(userId);
  }

  @Post('legs/:id/accept')
  @Roles('CARRIER')
  async accept(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.acceptLeg(id, userId);
  }

  @Post('legs/:id/reject')
  @Roles('CARRIER')
  async reject(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.rejectLeg(id, userId);
  }

  @Post('legs/:id/start')
  @Roles('CARRIER')
  async start(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.startLeg(id, userId);
  }

  @Post('legs/:id/arrive')
  @Roles('CARRIER')
  async arrive(@Req() req: Request, @Param('id') id: string, @Body() dto: ArriveLegDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.arriveLeg(id, userId, dto);
  }

  @Post('legs/:id/complete')
  @Roles('CARRIER')
  async complete(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.completeLeg(id, userId);
  }

  @Post('legs/:id/requeue')
  @Roles('ADMIN')
  async requeue(@Param('id') id: string) {
    return this.deliveryService.requeueLeg(id);
  }

  @Post('legs/:id/handoff/token')
  @Roles('CARRIER')
  async createHandoffToken(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.createHandoffToken(id, userId);
  }

  @Post('legs/:id/handoff/confirm')
  @Roles('CARRIER')
  async confirmHandoff(@Req() req: Request, @Param('id') id: string, @Body() dto: HandoffConfirmDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.confirmHandoff(id, userId, dto);
  }

  @Post('legs/:id/handoff/receive')
  @Roles('CARRIER')
  async receiveHandoff(@Req() req: Request, @Param('id') id: string, @Body() dto: HandoffAckDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.confirmHandoffReceive(id, userId, dto);
  }

  @Post('legs/:id/handoff/complete')
  @Roles('CARRIER')
  async completeHandoff(@Req() req: Request, @Param('id') id: string, @Body() dto: HandoffCompleteDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.completeHubHandoff(id, userId, dto);
  }

  @Post('legs/:id/drop-pick/drop')
  @Roles('CARRIER')
  async dropPickDrop(@Req() req: Request, @Param('id') id: string, @Body() dto: DropPickDropDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.dropPickDrop(id, userId, dto);
  }

  @Post('legs/:id/drop-pick/pickup')
  @Roles('CARRIER')
  async dropPickPickup(@Req() req: Request, @Param('id') id: string, @Body() dto: DropPickPickupDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.dropPickPickup(id, userId, dto);
  }

  @Post('proof-events/batch')
  async createProofEvents(@Req() req: Request, @Body() dto: ProofEventsBatchDto) {
    const userId = (req.user as any)?.id;
    return this.deliveryService.createProofEventsBatch(userId, dto);
  }
}
