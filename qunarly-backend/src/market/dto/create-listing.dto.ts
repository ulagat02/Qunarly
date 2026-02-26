import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PriceTierDto } from './price-tier.dto';

export class CreateListingDto {
  @IsString()
  @ApiProperty({ example: 'Бидай (1 сорт)' })
  title!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Құрғақ, биылғы өнім' })
  description?: string;

  @IsString()
  @ApiProperty({ example: 'GRAIN' })
  category!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Арнайы өнім' })
  customCategoryName?: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 1200 })
  quantity!: number;

  @IsString()
  @ApiProperty({ example: 'кг' })
  unit!: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 120 })
  price!: number;

  @IsString()
  @ApiProperty({ example: 'KZT' })
  currency!: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'FIXED' })
  priceType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'district-id' })
  districtId?: string;

  @IsString()
  @ApiProperty({ example: 'Алматы облысы, Қарасай' })
  addressText!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ example: ['file-id-1', 'file-id-2'] })
  imageFileIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ example: ['https://cdn.example.com/1.jpg'] })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ example: ['https://cdn.example.com/1.jpg'] })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTierDto)
  @ApiPropertyOptional({ type: [PriceTierDto] })
  tiers?: PriceTierDto[];
}
