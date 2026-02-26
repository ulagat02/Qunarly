import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class ReorderQueueDto {
  @IsString()
  @ApiProperty({ example: 'route-id' })
  routeId!: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1 })
  targetPosition!: number;
}
