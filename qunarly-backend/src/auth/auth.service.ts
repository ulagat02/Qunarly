import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcryptjs';

const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }
    if (!dto.homeAddressText?.trim() || !dto.homeRegion?.trim()) {
      throw new BadRequestException('Home address and region are required');
    }
    if (!Number.isFinite(dto.homeLat) || !Number.isFinite(dto.homeLng)) {
      throw new BadRequestException('Home координаттары міндетті');
    }
    if (dto.role === 'CARRIER') {
      if (!dto.maxWeightKg || dto.maxWeightKg <= 0) {
        throw new BadRequestException('maxWeightKg is required');
      }
      if (!dto.maxVolumeM3 && !dto.vehicleType) {
        throw new BadRequestException('maxVolumeM3 or vehicleType is required');
      }
    }

    const volumePresets: Record<string, number> = {
      GAZELLE: 10,
      TRUCK: 30,
      BIG_TRUCK: 60,
    };
    const resolvedVolume =
      dto.maxVolumeM3 ?? (dto.vehicleType ? volumePresets[dto.vehicleType] : undefined);

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

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `Login failed: NOT_FOUND email=${dto.email ?? '-'} phone=${dto.phone ?? '-'}`,
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`Login failed: BAD_PASSWORD userId=${user.id}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.role);
  }

  async devLogin(): Promise<AuthResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Invalid credentials');
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

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_secret',
    });
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash: payload.jti },
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueTokens(payload.sub, payload.role);
  }

  private async issueTokens(userId: string, role: string): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, role },
      {
        secret: process.env.JWT_SECRET || 'dev_secret',
        expiresIn: ACCESS_EXPIRES_IN,
      },
    );
    const refreshId = await bcrypt.hash(`${userId}:${Date.now()}`, 5);
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, role, jti: refreshId },
      {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev_secret',
        expiresIn: `${REFRESH_EXPIRES_IN_DAYS}d`,
      },
    );
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
}
