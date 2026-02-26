import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @ApiProperty({ example: 'from-hub-id' })
  fromHubId!: string;

  @IsString()
  @ApiProperty({ example: 'to-hub-id' })
  toHubId!: string;

  @IsIn(['VILLAGE_TO_DISTRICT', 'DISTRICT_TO_CITY', 'VILLAGE_TO_CITY'])
  @ApiProperty({ example: 'VILLAGE_TO_DISTRICT' })
  routeType!: 'VILLAGE_TO_DISTRICT' | 'DISTRICT_TO_CITY' | 'VILLAGE_TO_CITY';
}
