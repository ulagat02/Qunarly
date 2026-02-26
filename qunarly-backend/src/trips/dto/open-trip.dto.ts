import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class OpenTripDto {
  @IsString()
  @ApiProperty({ example: 'route-id' })
  routeId!: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 4 })
  totalSeats!: number;
}
