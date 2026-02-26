import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminAdjustGeoDto {
  @ApiProperty({ example: 43.2389 })
  @IsNumber()
  arrivedLat!: number;

  @ApiProperty({ example: 76.889 })
  @IsNumber()
  arrivedLng!: number;

  @ApiPropertyOptional({ example: 'hub-id' })
  @IsString()
  @IsOptional()
  arrivedHubId?: string;

  @ApiProperty({ example: 'Corrected GPS coordinates' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
