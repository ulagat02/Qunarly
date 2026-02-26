import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFieldJobDto {
  @IsString()
  @ApiProperty({ example: 'service-type-id' })
  serviceTypeId!: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 120 })
  areaHa!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 43.238949 })
  lat!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 76.889709 })
  lng!: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Алматы облысы, Қарасай' })
  pickupAddressText?: string;

  @IsString()
  @ApiProperty({ example: 'Алматы облысы' })
  pickupRegion!: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 1200 })
  cargoWeightKg!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 18 })
  cargoVolumeM3!: number;

  @IsString()
  @ApiProperty({ example: 'GRAIN' })
  cargoType!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 12 })
  distanceKm?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Суару қажет, 2 күн ішінде' })
  notes?: string;
}
