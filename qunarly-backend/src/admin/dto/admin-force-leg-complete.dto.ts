import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminForceLegCompleteDto {
  @ApiProperty({ example: 'FORCE' })
  @IsString()
  @IsNotEmpty()
  confirm!: string;

  @ApiProperty({ example: 'Incident fix: driver already delivered' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
