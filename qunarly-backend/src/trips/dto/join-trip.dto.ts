import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class JoinTripDto {
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1 })
  seatCount!: number;
}
