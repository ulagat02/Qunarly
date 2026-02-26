import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RouteStatus, RouteType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminRouteUpsertDto {
  @ApiProperty({ example: 'hub-from-id' })
  @IsString()
  @IsNotEmpty()
  fromHubId!: string;

  @ApiProperty({ example: 'hub-to-id' })
  @IsString()
  @IsNotEmpty()
  toHubId!: string;

  @ApiProperty({ enum: RouteType })
  @IsEnum(RouteType)
  routeType!: RouteType;

  @ApiPropertyOptional({ example: 'Route label' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ enum: RouteStatus })
  @IsEnum(RouteStatus)
  @IsOptional()
  status?: RouteStatus;

  @ApiProperty({ example: 'Route maintenance' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
