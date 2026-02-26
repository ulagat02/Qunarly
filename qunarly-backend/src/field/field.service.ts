import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFieldJobDto } from './dto/create-field-job.dto';
import { FieldJobStatus } from '@prisma/client';

const TRAVEL_FEE_PER_KM = Number(process.env.TRAVEL_FEE_PER_KM || 0);

@Injectable()
export class FieldService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async createJob(farmerId: string, dto: CreateFieldJobDto) {
    const farmer = await this.prisma.user.findUnique({
      where: { id: farmerId },
      select: { homeLat: true, homeLng: true, homeAddressText: true },
    });
    if (!farmer?.homeLat || !farmer?.homeLng || !farmer?.homeAddressText) {
      throw new BadRequestException('Home location is required');
    }
    const serviceType = await this.prisma.serviceType.findUnique({
      where: { id: dto.serviceTypeId },
    });
    if (!serviceType) {
      throw new NotFoundException('Service type not found');
    }
    const travelFee = (dto.distanceKm || 0) * TRAVEL_FEE_PER_KM;
    const priceEstimate = serviceType.baseRate * dto.areaHa + travelFee;
    const job = await this.prisma.fieldJob.create({
      data: {
        farmerId,
        serviceTypeId: dto.serviceTypeId,
        areaHa: dto.areaHa,
        lat: dto.lat,
        lng: dto.lng,
        pickupAddressText: dto.pickupAddressText,
        pickupRegion: dto.pickupRegion,
        cargoWeightKg: dto.cargoWeightKg,
        cargoVolumeM3: dto.cargoVolumeM3,
        cargoType: dto.cargoType,
        notes: dto.notes,
        priceEstimate,
        status: FieldJobStatus.BROADCASTED,
      },
    });
    await this.audit.log(farmerId, 'field.job.created', { jobId: job.id });
    return job;
  }

  async listJobs() {
    return this.prisma.fieldJob.findMany({ include: { serviceType: true } });
  }

  async getJob(id: string) {
    const job = await this.prisma.fieldJob.findUnique({
      where: { id },
      include: { serviceType: true },
    });
    if (!job) {
      throw new NotFoundException('Field job not found');
    }
    return job;
  }

  async acceptJob(id: string, executorId: string) {
    const job = await this.prisma.fieldJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Field job not found');
    }
    if (job.status !== FieldJobStatus.BROADCASTED) {
      throw new BadRequestException('Job is not available');
    }
    return this.prisma.fieldJob.update({
      where: { id },
      data: {
        acceptedBy: executorId,
        status: FieldJobStatus.ACCEPTED,
      },
    });
  }

  async startJob(id: string, executorId: string) {
    const job = await this.prisma.fieldJob.findUnique({ where: { id } });
    if (!job || job.acceptedBy !== executorId) {
      throw new BadRequestException('Job not accepted');
    }
    return this.prisma.fieldJob.update({
      where: { id },
      data: { status: FieldJobStatus.IN_PROGRESS },
    });
  }

  async completeJob(id: string, executorId: string) {
    const job = await this.prisma.fieldJob.findUnique({ where: { id } });
    if (!job || job.acceptedBy !== executorId) {
      throw new BadRequestException('Job not accepted');
    }
    const updated = await this.prisma.fieldJob.update({
      where: { id },
      data: { status: FieldJobStatus.COMPLETED },
    });
    await this.audit.log(executorId, 'field.job.completed', { jobId: updated.id });
    return updated;
  }

  async cancelJob(id: string, userId: string) {
    const job = await this.prisma.fieldJob.findUnique({ where: { id } });
    if (!job || job.farmerId !== userId) {
      throw new BadRequestException('Job not accessible');
    }
    return this.prisma.fieldJob.update({
      where: { id },
      data: { status: FieldJobStatus.CANCELLED },
    });
  }
}
