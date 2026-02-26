import { PartialType } from '@nestjs/mapped-types';
import { CreateListingDto } from './create-listing.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ProductListingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { PriceTierDto } from './price-tier.dto';

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @IsOptional()
  @IsEnum(ProductListingStatus)
  @ApiPropertyOptional({ enum: ProductListingStatus, example: ProductListingStatus.PUBLISHED })
  status?: ProductListingStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ example: ['file-id-1', 'file-id-2'] })
  imageFileIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTierDto)
  @ApiPropertyOptional({ type: [PriceTierDto] })
  tiers?: PriceTierDto[];
}
