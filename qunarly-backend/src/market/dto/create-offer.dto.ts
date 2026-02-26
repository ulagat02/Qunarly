import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOfferDto {
  @IsNumber()
  @ApiProperty({ example: 120 })
  price!: number;

  @IsNumber()
  @ApiProperty({ example: 500 })
  quantity!: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Бүгін аламын' })
  message?: string;
}
