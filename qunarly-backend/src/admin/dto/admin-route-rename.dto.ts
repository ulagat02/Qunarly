import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminRouteRenameDto {
  @ApiProperty({ example: 'Route label' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: 'Rename for clarity' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
