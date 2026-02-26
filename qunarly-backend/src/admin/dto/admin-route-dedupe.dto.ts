import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminRouteDedupeDto {
  @ApiProperty({ example: 'canonical-route-id' })
  @IsString()
  @IsNotEmpty()
  canonicalRouteId!: string;

  @ApiProperty({ example: 'Deduplicate routes' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
