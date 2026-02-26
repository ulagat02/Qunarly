import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAddressPointDto {
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 43.238949 })
  lat!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 76.889709 })
  lng!: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Абай даңғылы' })
  street?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '10' })
  houseNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Шамалған' })
  locality?: string;
}
