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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../common/prisma.service");
const bcrypt = require("bcryptjs");
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        if (!dto.email && !dto.phone) {
            throw new common_1.BadRequestException('Email or phone is required');
        }
        if (!dto.homeAddressText?.trim() || !dto.homeRegion?.trim()) {
            throw new common_1.BadRequestException('Home address and region are required');
        }
        if (!Number.isFinite(dto.homeLat) || !Number.isFinite(dto.homeLng)) {
            throw new common_1.BadRequestException('Home координаттары міндетті');
        }
        if (dto.role === 'CARRIER') {
            if (!dto.maxWeightKg || dto.maxWeightKg <= 0) {
                throw new common_1.BadRequestException('maxWeightKg is required');
            }
            if (!dto.maxVolumeM3 && !dto.vehicleType) {
                throw new common_1.BadRequestException('maxVolumeM3 or vehicleType is required');
            }
        }
        const volumePresets = {
            GAZELLE: 10,
            TRUCK: 30,
            BIG_TRUCK: 60,
        };
        const resolvedVolume = dto.maxVolumeM3 ?? (dto.vehicleType ? volumePresets[dto.vehicleType] : undefined);
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                role: dto.role,
                homeAddressText: dto.homeAddressText.trim(),
                homeRegion: dto.homeRegion.trim(),
                homeLat: dto.homeLat,
                homeLng: dto.homeLng,
                homeUpdatedAt: new Date(),
            },
        });
        if (dto.role === 'CARRIER') {
            await this.prisma.carrierProfile.create({
                data: {
                    userId: user.id,
                    vehicleTypes: dto.vehicleType ? [dto.vehicleType] : [],
                    capacityKg: dto.maxWeightKg ?? 0,
                    maxWeightKg: dto.maxWeightKg ?? 0,
                    maxVolumeM3: resolvedVolume ?? null,
                    vehicleType: dto.vehicleType ?? null,
                    refrigerated: dto.refrigerated ?? false,
                    livestockAllowed: dto.livestockAllowed ?? false,
                    closedBody: dto.closedBody ?? false,
                    regions: [],
                    isActive: true,
                },
            });
        }
        return this.issueTokens(user.id, user.role);
    }
    async login(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    dto.email ? { email: dto.email } : undefined,
                    dto.phone ? { phone: dto.phone } : undefined,
                ].filter(Boolean),
            },
        });
        if (!user) {
            if (process.env.NODE_ENV !== 'production') {
                this.logger.warn(`Login failed: NOT_FOUND email=${dto.email ?? '-'} phone=${dto.phone ?? '-'}`);
            }
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            if (process.env.NODE_ENV !== 'production') {
                this.logger.warn(`Login failed: BAD_PASSWORD userId=${user.id}`);
            }
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.issueTokens(user.id, user.role);
    }
    async devLogin() {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const adminEmail = 'admin@qunarly.kz';
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: adminEmail }, { role: 'ADMIN' }],
            },
        });
        if (!user) {
            const passwordHash = await bcrypt.hash('Admin123!', 10);
            user = await this.prisma.user.create({
                data: {
                    email: adminEmail,
                    passwordHash,
                    role: 'ADMIN',
                },
            });
        }
        return this.issueTokens(user.id, user.role);
    }
    async refresh(refreshToken) {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_secret',
        });
        const stored = await this.prisma.refreshToken.findFirst({
            where: { userId: payload.sub, tokenHash: payload.jti },
        });
        if (!stored) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        return this.issueTokens(payload.sub, payload.role);
    }
    async issueTokens(userId, role) {
        const accessToken = await this.jwtService.signAsync({ sub: userId, role }, {
            secret: process.env.JWT_SECRET || 'dev_secret',
            expiresIn: ACCESS_EXPIRES_IN,
        });
        const refreshId = await bcrypt.hash(`${userId}:${Date.now()}`, 5);
        const refreshToken = await this.jwtService.signAsync({ sub: userId, role, jti: refreshId }, {
            secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_secret',
            expiresIn: `${REFRESH_EXPIRES_IN_DAYS}d`,
        });
        const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: refreshId,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map