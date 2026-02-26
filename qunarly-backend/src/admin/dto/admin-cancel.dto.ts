import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminCancelDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'customer request' })
  reason!: string;
}
