import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class HandoffCompleteDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 43.25 })
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 76.9 })
  lng?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'qr:abc123' })
  proofCode?: string;
}
