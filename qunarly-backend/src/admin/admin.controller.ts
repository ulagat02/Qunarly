import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { Request, Response } from 'express';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('orders')
  async listOrders(@Query() query: Record<string, string>) {
    return this.adminService.listOrders(query);
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Get(['delivery/stuck', 'stuck'])
  async listStuck() {
    return this.adminService.listStuck();
  }

  @Get('disputes')
  async listDisputes(@Query() query: Record<string, string>) {
    return this.adminService.listDisputes(query);
  }

  @Get('disputes/:id')
  async getDispute(@Param('id') id: string) {
    return this.adminService.getDisputeDetail(id);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('audit')
  async listAudit(@Query() query: Record<string, string>) {
    return this.adminService.listAudit(query);
  }

  @Get('users')
  async listUsers(@Query() query: Record<string, string>) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('alerts')
  async listAlerts() {
    return this.adminService.listAlerts();
  }

  @Get('playbooks')
  async listPlaybooks() {
    return this.adminService.listPlaybooks();
  }

  @Get('slas')
  async listSlas() {
    return this.adminService.listSlas();
  }

  @Get('hubs')
  async listHubs(@Query() query: Record<string, string>) {
    return this.adminService.listHubs();
  }

  @Get('routes')
  async listRoutes(@Query() query: Record<string, string>) {
    return this.adminService.listRoutes();
  }

  @Get('commission/config')
  async listCommissionConfig() {
    return this.adminService.listCommissionConfig();
  }

  @Get('commission/ledger')
  async listCommissionLedger(@Query() query: Record<string, string>) {
    return this.adminService.listCommissionLedger();
  }

  @Get('commission/anomalies')
  async listCommissionAnomalies(@Query() query: Record<string, string>) {
    return this.adminService.listCommissionAnomalies();
  }

  @Get('jarmenke/events')
  async listJarmenkeEvents() {
    return this.adminService.listJarmenkeEvents();
  }

  @Get('access-list')
  async listAccessList(@Query() query: Record<string, string>) {
    return this.adminService.listAccessList();
  }

  @Get('fraud/signals')
  async listFraudSignals(@Query() query: Record<string, string>) {
    return this.adminService.listFraudSignals();
  }

  @Get('rate-limits')
  async listRateLimits() {
    return this.adminService.listRateLimits();
  }

  @Get('infra/health')
  async infraHealth() {
    return this.adminService.getInfraHealth();
  }

  @Get('infra/orphans')
  async infraOrphans() {
    return this.adminService.getInfraOrphans();
  }

  @Get('exports/stats')
  async exportStats(@Res() res: Response, @Query('format') format?: string) {
    const csv = await this.adminService.exportStatsCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stats.csv"');
    res.send(csv);
  }

  @Get('exports/commission')
  async exportCommission(@Res() res: Response, @Query() query: Record<string, string>) {
    const csv = await this.adminService.exportCommissionCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="commission.csv"');
    res.send(csv);
  }

  @Post('orders/:id/cancel')
  async cancelOrder(@Req() req: Request, @Param('id') id: string, @Body() body: { reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.cancelOrder(id, userId, body.reason ?? '');
  }

  @Post('orders/:id/force-status')
  async forceOrderStatus(@Req() req: Request, @Param('id') id: string, @Body() body: { status: string; reason: string; confirm: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.forceOrderStatus(id, userId, body.status, body.reason ?? '');
  }

  @Post('orders/:id/dispute')
  async openDispute(@Req() req: Request, @Param('id') id: string, @Body() body: { reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.openDispute(id, userId, body.reason ?? '');
  }

  @Post('orders/:id/dispute/resolve')
  async resolveDispute(@Req() req: Request, @Param('id') id: string, @Body() body: { resolution: string; resolutionNote?: string; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.resolveDispute(id, userId, body.resolution, body.resolutionNote, body.reason ?? '');
  }

  @Post('orders/:id/refund-flag')
  async flagRefund(@Req() req: Request, @Param('id') id: string, @Body() body: { reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.flagRefund(id, userId, body.reason ?? '');
  }

  @Post('delivery/legs/:id/reassign')
  async reassignLeg(@Req() req: Request, @Param('id') id: string, @Body() body: { driverId: string; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.reassignLeg(id, userId, body.driverId ?? '', body.reason ?? '');
  }

  @Post('delivery/legs/:id/unlock-mainline')
  async unlockMainline(@Req() req: Request, @Param('id') id: string, @Body() body: { reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.unlockMainline(id, userId, body.reason ?? '');
  }

  @Post('delivery/legs/:id/force-complete')
  async forceCompleteLeg(@Req() req: Request, @Param('id') id: string, @Body() body: { confirm: string; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.forceCompleteLeg(id, userId, body.reason ?? '');
  }

  @Post('delivery/legs/:id/proof')
  async attachLegProof(@Req() req: Request, @Param('id') id: string, @Body() body: { eventType: string; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.attachLegProof(id, userId, body.eventType, body.reason ?? '');
  }

  @Post('delivery/legs/:id/adjust-geo')
  async adjustLegGeo(@Req() req: Request, @Param('id') id: string, @Body() body: { arrivedLat: number; arrivedLng: number; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.adjustLegGeo(id, userId, body.arrivedLat, body.arrivedLng, body.reason ?? '');
  }

  @Post('slas')
  async createSla(@Req() req: Request, @Body() body: { legSortOrder: number; minutes: number; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.createSla(userId, body.legSortOrder, body.minutes, body.reason ?? '');
  }

  @Post('slas/:id')
  async updateSla(@Req() req: Request, @Param('id') id: string, @Body() body: { legSortOrder: number; minutes: number; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.updateSla(id, userId, body.legSortOrder, body.minutes, body.reason ?? '');
  }

  @Post('alerts')
  async createAlert(@Req() req: Request, @Body() body: { key: string; threshold: number; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.createAlert(userId, body.key, body.threshold, body.reason ?? '');
  }

  @Post('alerts/:id')
  async updateAlert(@Req() req: Request, @Param('id') id: string, @Body() body: { key: string; threshold: number; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.updateAlert(id, userId, body.key, body.threshold, body.reason ?? '');
  }

  @Post('playbooks')
  async createPlaybook(@Req() req: Request, @Body() body: { key: string; title: string; stepsMarkdown: string; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.createPlaybook(userId, body.key, body.title, body.stepsMarkdown, body.reason ?? '');
  }

  @Post('playbooks/:id')
  async updatePlaybook(@Req() req: Request, @Param('id') id: string, @Body() body: { key: string; title: string; stepsMarkdown: string; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.updatePlaybook(id, userId, body.key, body.title, body.stepsMarkdown, body.reason ?? '');
  }

  @Post('hubs')
  async createHub(@Req() req: Request, @Body() body: { name: string; lat: number; lng: number; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.adminCreateHub(userId, body.name, body.lat, body.lng, body.reason ?? '');
  }

  @Post('routes')
  async createRoute(@Req() req: Request, @Body() body: { fromHubId: string; toHubId: string; routeType: string; reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.adminCreateRoute(userId, body.fromHubId, body.toHubId, body.routeType, body.reason ?? '');
  }

  @Post('commission/config')
  async createCommissionConfig(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const userId = (req as any).user?.id;
    return this.adminService.createCommissionConfig(userId, body, (body.reason as string) ?? '');
  }

  @Post('jarmenke/events')
  async createJarmenkeEvent(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const userId = (req as any).user?.id;
    return this.adminService.adminCreateJarmenkeEvent(userId, body, (body.reason as string) ?? '');
  }

  @Post('access-list')
  async createAccessList(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const userId = (req as any).user?.id;
    return this.adminService.createAccessListEntry(userId, body, (body.reason as string) ?? '');
  }

  @Post('access-list/:id/remove')
  async removeAccessList(@Req() req: Request, @Param('id') id: string, @Body() body: { reason: string }) {
    const userId = (req as any).user?.id;
    return this.adminService.removeAccessListEntry(id, userId, body.reason ?? '');
  }

  @Post('rate-limits')
  async createRateLimit(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const userId = (req as any).user?.id;
    return this.adminService.createRateLimit(userId, body, (body.reason as string) ?? '');
  }

  @Post('fraud/signals/:id/resolve')
  async resolveFraudSignal(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const userId = (req as any).user?.id;
    return this.adminService.resolveFraudSignal(id, userId, body, (body.reason as string) ?? '');
  }
}
