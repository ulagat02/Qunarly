import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class AdminRateLimitDto {
  @ApiProperty({ example: 'auth.login' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  limit!: number;

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  windowSeconds!: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'Tighten login policy' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
