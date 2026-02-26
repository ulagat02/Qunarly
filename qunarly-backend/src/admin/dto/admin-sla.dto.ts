import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AdminSlaUpsertDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  legSortOrder!: number;

  @ApiProperty({ example: 45 })
  @IsInt()
  @Min(1)
  minutes!: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'Adjust SLA for leg 1' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
