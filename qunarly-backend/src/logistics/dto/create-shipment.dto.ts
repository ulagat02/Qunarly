import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'deal-id' })
  dealId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'contract-id' })
  contractId?: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 43.238949 })
  originLat!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 76.889709 })
  originLng!: number;

  @IsString()
  @ApiProperty({ example: 'Алматы облысы, Қарасай' })
  originAddressText!: string;

  @IsString()
  @ApiProperty({ example: 'Алматы облысы' })
  originRegion!: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 43.310001 })
  destLat!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 76.940001 })
  destLng!: number;

  @IsString()
  @ApiProperty({ example: 'Алматы қ., Әуезов' })
  destAddressText!: string;

  @IsString()
  @ApiProperty({ example: 'Алматы қ.' })
  destRegion!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Астық' })
  cargoDescription?: string;

  @IsString()
  @ApiProperty({ example: 'GRAIN' })
  cargoType!: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 1200 })
  weightKg!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 18 })
  volumeM3!: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'PALLET' })
  packageType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Абаяй қаптаңыз' })
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 35000 })
  priceOffer?: number;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ example: { description: 'Астық', weightKg: 1200 } })
  cargoJson?: unknown;
}
