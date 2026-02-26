import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class AdminForceOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiProperty({ example: 'Incident fix: manual correction' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ example: 'FORCE' })
  @IsString()
  @IsNotEmpty()
  confirm!: string;
}
