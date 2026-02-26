import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ScheduleType } from '@prisma/client';

export class CreateRouteTemplateDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Шелек - Алматы' })
  name?: string;

  @IsString()
  @ApiProperty({ example: 'hub-id-a' })
  fromHubId!: string;

  @IsString()
  @ApiProperty({ example: 'hub-id-b' })
  toHubId!: string;

  @IsOptional()
  @IsEnum(ScheduleType)
  @ApiPropertyOptional({ enum: ScheduleType, example: ScheduleType.QUEUE })
  scheduleType?: ScheduleType;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ example: 1500 })
  typicalPrice?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}
