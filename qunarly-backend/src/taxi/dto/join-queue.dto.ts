import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class JoinQueueDto {
  @IsString()
  @ApiProperty({ example: 'route-id' })
  routeId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 4, required: false })
  capacity?: number;
}
