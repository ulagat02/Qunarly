import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminIncidentPlaybookDto {
  @ApiProperty({ example: 'LEG2_NOT_OPENING' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ example: 'LEG2 ашылмай қалды' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: '- Check leg1 handoff proof\n- Unlock mainline if needed' })
  @IsString()
  @IsNotEmpty()
  stepsMarkdown!: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'Add incident guidance' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
