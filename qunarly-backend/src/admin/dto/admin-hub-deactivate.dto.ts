import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminHubDeactivateDto {
  @ApiProperty({ example: 'Deactivate hub' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
