import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ProofEventDto } from './proof-event.dto';

export class ProofEventsBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProofEventDto)
  events!: ProofEventDto[];
}
