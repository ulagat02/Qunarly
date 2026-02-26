import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class OrderItemInputDto {
  @IsString()
  @ApiProperty({ example: 'listing-id' })
  listingId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @ApiProperty({ example: 100 })
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @ApiProperty({ example: 'c65e9d98-6c65-4ae6-9df0-4b2c08f8e1f7' })
  idempotencyKey!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  @ApiPropertyOptional({ type: [OrderItemInputDto] })
  items?: OrderItemInputDto[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'listing-id' })
  listingId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ApiPropertyOptional({ example: 100 })
  quantity?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 500 })
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'STANDARD' })
  deliveryOption?: string;

  @IsString()
  @ApiProperty({ example: 'Алматы қ., Әуезов ауданы' })
  destinationText!: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false, example: 43.2405 })
  destLat?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @ApiProperty({ required: false, example: 76.9037 })
  destLng?: number;
}
