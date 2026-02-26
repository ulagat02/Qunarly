import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRideRequestDto {
  @IsString()
  @ApiProperty({ example: 'route-id' })
  routeId!: string;

  @IsString()
  @ApiProperty({ example: 'дүкен қасы' })
  pickupText!: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1 })
  seats!: number;

  @IsIn(['NONE', 'SMALL', 'LARGE'])
  @ApiProperty({ example: 'NONE' })
  cargoType!: 'NONE' | 'SMALL' | 'LARGE';

  @IsIn(['TODAY', 'TOMORROW'])
  @ApiProperty({ example: 'TODAY' })
  departureType!: 'TODAY' | 'TOMORROW';

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ example: false, required: false })
  waitUntilFull?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'uuid-from-client', required: false })
  clientRequestId?: string;
}
