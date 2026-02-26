import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  homeAddressText!: string;

  @IsString()
  homeRegion!: string;

  @IsNumber()
  @Type(() => Number)
  homeLat!: number;

  @IsNumber()
  @Type(() => Number)
  homeLng!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxVolumeM3?: number;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsBoolean()
  refrigerated?: boolean;

  @IsOptional()
  @IsBoolean()
  livestockAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  closedBody?: boolean;
}
