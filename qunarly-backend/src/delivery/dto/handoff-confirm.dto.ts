import { IsNumber, IsOptional, IsString } from 'class-validator';

export class HandoffConfirmDto {
  @IsString()
  token!: string;

  @IsNumber()
  senderLat!: number;

  @IsNumber()
  senderLng!: number;

  @IsOptional()
  @IsNumber()
  receiverLat?: number;

  @IsOptional()
  @IsNumber()
  receiverLng?: number;
}
