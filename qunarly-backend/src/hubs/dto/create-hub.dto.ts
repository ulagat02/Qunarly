import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHubDto {
  @IsString()
  @ApiProperty({ example: 'Шелек Хаб' })
  name!: string;

  @IsNumber()
  @ApiProperty({ example: 43.5942 })
  lat!: number;

  @IsNumber()
  @ApiProperty({ example: 78.3547 })
  lng!: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ example: 0.8 })
  radiusKm?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'region-id' })
  regionId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'district-id' })
  districtId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}
