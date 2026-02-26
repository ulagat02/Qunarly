import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AdminAlertConfigDto {
  @ApiProperty({ example: 'stuck.count' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  threshold!: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'Increase stuck threshold' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
