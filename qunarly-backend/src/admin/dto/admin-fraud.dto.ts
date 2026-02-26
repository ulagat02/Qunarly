import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FraudSignalStatus, FraudSignalType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminFraudSignalDto {
  @ApiProperty({ enum: FraudSignalType })
  @IsEnum(FraudSignalType)
  type!: FraudSignalType;

  @ApiPropertyOptional({ example: 'order-id' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ example: 'user-id' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'hashed-ip' })
  @IsString()
  @IsOptional()
  ipHash?: string;

  @ApiProperty({ example: 'Suspicious pattern detected' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class AdminFraudResolveDto {
  @ApiProperty({ enum: FraudSignalStatus })
  @IsEnum(FraudSignalStatus)
  status!: FraudSignalStatus;

  @ApiProperty({ example: 'Reviewed and resolved' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
