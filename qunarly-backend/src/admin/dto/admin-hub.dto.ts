import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AdminHubUpsertDto {
  @ApiProperty({ example: 'Алматы Хаб' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 43.2389 })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 76.889 })
  @IsNumber()
  lng!: number;

  @ApiPropertyOptional({ example: 0.8 })
  @IsNumber()
  @Min(0.1)
  @IsOptional()
  radiusKm?: number;

  @ApiPropertyOptional({ example: 'region-id' })
  @IsString()
  @IsOptional()
  regionId?: string;

  @ApiPropertyOptional({ example: 'district-id' })
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'Update hub config' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
