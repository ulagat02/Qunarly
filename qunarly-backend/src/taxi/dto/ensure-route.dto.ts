import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class EnsureRouteDto {
  @IsString()
  @ApiProperty({ example: 'origin-hub-id' })
  originHubId!: string;

  @IsString()
  @ApiProperty({ example: 'dest-hub-id' })
  destHubId!: string;

  @IsOptional()
  @IsIn(['VILLAGE_TO_DISTRICT', 'DISTRICT_TO_CITY', 'VILLAGE_TO_CITY'])
  @ApiProperty({ example: 'VILLAGE_TO_DISTRICT' })
  routeType?: 'VILLAGE_TO_DISTRICT' | 'DISTRICT_TO_CITY' | 'VILLAGE_TO_CITY';
}
