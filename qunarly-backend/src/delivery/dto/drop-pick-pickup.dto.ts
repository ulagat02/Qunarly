import { IsNumber, IsOptional, IsString } from 'class-validator';

export class DropPickPickupDto {
  @IsString()
  token!: string;

  @IsNumber()
  pickupLat!: number;

  @IsNumber()
  pickupLng!: number;

  @IsOptional()
  @IsString()
  pickupPhoto1Id?: string;

  @IsOptional()
  @IsString()
  pickupPhoto2Id?: string;
}
