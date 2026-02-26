import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeResolution } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminOpenDisputeDto {
  @ApiProperty({ example: 'Proof missing, buyer complains' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class AdminResolveDisputeDto {
  @ApiProperty({ enum: DisputeResolution })
  @IsEnum(DisputeResolution)
  resolution!: DisputeResolution;

  @ApiPropertyOptional({ example: 'Refund requested via external channel' })
  @IsString()
  @IsOptional()
  resolutionNote?: string;

  @ApiProperty({ example: 'Incident review completed' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
