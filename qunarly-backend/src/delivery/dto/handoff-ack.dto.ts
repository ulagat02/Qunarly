import { IsNumber, IsOptional } from 'class-validator';

export class HandoffAckDto {
  @IsOptional()
  @IsNumber()
  receiverLat?: number;

  @IsOptional()
  @IsNumber()
  receiverLng?: number;
}
