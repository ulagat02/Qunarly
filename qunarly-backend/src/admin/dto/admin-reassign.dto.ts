import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminReassignDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'driver-user-id' })
  driverId!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'manual reassignment' })
  reason!: string;
}
