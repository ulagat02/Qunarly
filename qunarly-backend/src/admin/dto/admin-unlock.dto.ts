import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminUnlockDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'manual override' })
  reason!: string;
}
