import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FieldService } from './field.service';
import { CreateFieldJobDto } from './dto/create-field-job.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

@Controller('field')
@ApiBearerAuth()
export class FieldController {
  private readonly logger = new Logger(FieldController.name);

  constructor(private fieldService: FieldService) {}

  @Post('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async createJob(@Req() req: Request, @Body() dto: CreateFieldJobDto) {
    const user = req.user as { id: string };
    this.logger.log(`createJob body=${JSON.stringify(req.body)}`);
    this.logger.log(`createJob dto=${JSON.stringify(dto)}`);
    try {
      return await this.fieldService.createJob(user.id, dto);
    } catch (error) {
      this.logger.error('createJob failed', error instanceof Error ? error.stack : `${error}`);
      throw error;
    }
  }

  @Get('jobs')
  async listJobs() {
    return this.fieldService.listJobs();
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return this.fieldService.getJob(id);
  }

  @Post('jobs/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EXECUTOR)
  async acceptJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.fieldService.acceptJob(id, user.id);
  }

  @Post('jobs/:id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EXECUTOR)
  async startJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.fieldService.startJob(id, user.id);
  }

  @Post('jobs/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EXECUTOR)
  async completeJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.fieldService.completeJob(id, user.id);
  }

  @Post('jobs/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FARMER)
  async cancelJob(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.fieldService.cancelJob(id, user.id);
  }
}
