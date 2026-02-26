import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProofEventType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminLegProofDto {
  @ApiProperty({ enum: ProofEventType })
  @IsEnum(ProofEventType)
  eventType!: ProofEventType;

  @ApiPropertyOptional({ example: 43.2389 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ example: 76.889 })
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ example: ['file-id-1', 'file-id-2'] })
  @IsOptional()
  metaJson?: Record<string, unknown>;

  @ApiProperty({ example: 'Admin attached proof' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
