import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CounterOfferDto {
  @IsNumber()
  @ApiProperty({ example: 115 })
  price!: number;

  @IsNumber()
  @ApiProperty({ example: 450 })
  quantity!: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Бағаны сәл түсіреміз' })
  message?: string;
}
