import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminHubMergeDto {
  @ApiProperty({ example: 'target-hub-id' })
  @IsString()
  @IsNotEmpty()
  targetHubId!: string;

  @ApiProperty({ example: 'Merge duplicates' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
