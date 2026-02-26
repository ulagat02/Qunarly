import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateJarmenkeEventDto {
  @IsDateString()
  @ApiProperty({ example: '2026-02-15T00:00:00.000Z' })
  startAt!: string;

  @IsDateString()
  @ApiProperty({ example: '2026-02-22T00:00:00.000Z' })
  endAt!: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 2 })
  productRateOverridePercent?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 2 })
  deliveryRateOverridePercent?: number;
}
