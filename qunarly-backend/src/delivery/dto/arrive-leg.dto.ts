import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class ArriveLegDto {
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  lng!: number;
}
