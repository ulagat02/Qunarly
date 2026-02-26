"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const TRAVEL_FEE_PER_KM = Number(process.env.TRAVEL_FEE_PER_KM || 0);
let FieldService = class FieldService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createJob(farmerId, dto) {
        const farmer = await this.prisma.user.findUnique({
            where: { id: farmerId },
            select: { homeLat: true, homeLng: true, homeAddressText: true },
        });
        if (!farmer?.homeLat || !farmer?.homeLng || !farmer?.homeAddressText) {
            throw new common_1.BadRequestException('Home location is required');
        }
        const serviceType = await this.prisma.serviceType.findUnique({
            where: { id: dto.serviceTypeId },
        });
        if (!serviceType) {
            throw new common_1.NotFoundException('Service type not found');
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
                status: client_1.FieldJobStatus.BROADCASTED,
            },
        });
        await this.audit.log(farmerId, 'field.job.created', { jobId: job.id });
        return job;
    }
    async listJobs() {
        return this.prisma.fieldJob.findMany({ include: { serviceType: true } });
    }
    async getJob(id) {
        const job = await this.prisma.fieldJob.findUnique({
            where: { id },
            include: { serviceType: true },
        });
        if (!job) {
            throw new common_1.NotFoundException('Field job not found');
        }
        return job;
    }
    async acceptJob(id, executorId) {
        const job = await this.prisma.fieldJob.findUnique({ where: { id } });
        if (!job) {
            throw new common_1.NotFoundException('Field job not found');
        }
        if (job.status !== client_1.FieldJobStatus.BROADCASTED) {
            throw new common_1.BadRequestException('Job is not available');
        }
        return this.prisma.fieldJob.update({
            where: { id },
            data: {
                acceptedBy: executorId,
                status: client_1.FieldJobStatus.ACCEPTED,
            },
        });
    }
    async startJob(id, executorId) {
        const job = await this.prisma.fieldJob.findUnique({ where: { id } });
        if (!job || job.acceptedBy !== executorId) {
            throw new common_1.BadRequestException('Job not accepted');
        }
        return this.prisma.fieldJob.update({
            where: { id },
            data: { status: client_1.FieldJobStatus.IN_PROGRESS },
        });
    }
    async completeJob(id, executorId) {
        const job = await this.prisma.fieldJob.findUnique({ where: { id } });
        if (!job || job.acceptedBy !== executorId) {
            throw new common_1.BadRequestException('Job not accepted');
        }
        const updated = await this.prisma.fieldJob.update({
            where: { id },
            data: { status: client_1.FieldJobStatus.COMPLETED },
        });
        await this.audit.log(executorId, 'field.job.completed', { jobId: updated.id });
        return updated;
    }
    async cancelJob(id, userId) {
        const job = await this.prisma.fieldJob.findUnique({ where: { id } });
        if (!job || job.farmerId !== userId) {
            throw new common_1.BadRequestException('Job not accessible');
        }
        return this.prisma.fieldJob.update({
            where: { id },
            data: { status: client_1.FieldJobStatus.CANCELLED },
        });
    }
};
exports.FieldService = FieldService;
exports.FieldService = FieldService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], FieldService);
//# sourceMappingURL=field.service.js.map