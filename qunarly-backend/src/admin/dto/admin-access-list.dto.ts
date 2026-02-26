import { ApiProperty } from '@nestjs/swagger';
import { AccessListTarget, AccessListType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AdminAccessListDto {
  @ApiProperty({ enum: AccessListType })
  @IsEnum(AccessListType)
  listType!: AccessListType;

  @ApiProperty({ enum: AccessListTarget })
  @IsEnum(AccessListTarget)
  targetType!: AccessListTarget;

  @ApiProperty({ example: 'user-id-or-phone' })
  @IsString()
  @IsNotEmpty()
  targetValue!: string;

  @ApiProperty({ example: 'Suspicious activity' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  // no isActive; removal handled explicitly
}
