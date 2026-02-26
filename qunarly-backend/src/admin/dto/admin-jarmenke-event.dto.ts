import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdminJarmenkeEventDto {
  @ApiProperty({ example: '2026-02-01T00:00:00.000Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2026-02-07T23:59:59.000Z' })
  @IsDateString()
  endAt!: string;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  productRateOverridePercent?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryRateOverridePercent?: number;

  @ApiProperty({ example: 'Weekly fair override' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
