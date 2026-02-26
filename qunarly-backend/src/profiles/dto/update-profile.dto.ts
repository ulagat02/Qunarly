import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Ұлағат' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Ұлағат' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Ulagat Farmer' })
  displayName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Тәжірибелі фермер, 10 жылдық тәжірибе.' })
  bio?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  publicProfile?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '+77478399145' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'region-id' })
  regionId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'district-id' })
  districtId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'settlement-id' })
  settlementId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Qunarly Farm' })
  farmName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'file-id' })
  avatarFileId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  avatarUrl?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 43.238949 })
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 76.889709 })
  lng?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Алматы, Бостандық, 12' })
  addressText?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Алматы, Бостандық' })
  homeAddressText?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Алматы облысы' })
  homeRegion?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 43.238949 })
  homeLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 76.889709 })
  homeLng?: number;
}
