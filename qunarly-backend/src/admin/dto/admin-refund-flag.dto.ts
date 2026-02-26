import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminRefundFlagDto {
  @ApiProperty({ example: 'Refund requested due to delay' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
