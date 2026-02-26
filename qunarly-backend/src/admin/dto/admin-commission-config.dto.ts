import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionScope } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdminCommissionConfigDto {
  @ApiProperty({ enum: CommissionScope })
  @IsEnum(CommissionScope)
  scope!: CommissionScope;

  @ApiPropertyOptional({ example: 'region-id' })
  @IsString()
  @IsOptional()
  regionId?: string;

  @ApiPropertyOptional({ example: 'vegetables' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  productRatePercent!: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  deliveryRatePercent!: number;

  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  @IsDateString()
  effectiveFrom!: string;

  @ApiPropertyOptional({ example: '2026-02-28T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'New rates for region' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
