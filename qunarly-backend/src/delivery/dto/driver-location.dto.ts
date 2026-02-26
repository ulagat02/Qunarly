import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DriverType } from '@prisma/client';

export class DriverLocationDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsEnum(DriverType)
  driverType?: DriverType;

  @IsOptional()
  @IsString()
  homeRegion?: string;

  @IsOptional()
  @IsString()
  routeCorridor?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsNumber()
  capacityKg?: number;
}
