import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PriceTierDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 100 })
  minQty!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ApiPropertyOptional({ example: 500 })
  maxQty?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 115 })
  unitPrice!: number;

  @IsString()
  @ApiProperty({ example: 'KZT' })
  currency!: string;
}
