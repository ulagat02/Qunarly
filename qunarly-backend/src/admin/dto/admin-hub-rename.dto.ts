import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminHubRenameDto {
  @ApiProperty({ example: 'Жаңа атау' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Duplicate fix' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
