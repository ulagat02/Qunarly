import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class DropPickDropDto {
  @IsNumber()
  dropLat!: number;

  @IsNumber()
  dropLng!: number;

  @IsString()
  dropPhoto1Id!: string;

  @IsString()
  dropPhoto2Id!: string;

  @IsOptional()
  @IsInt()
  pickupExpiresInMinutes?: number;
}
