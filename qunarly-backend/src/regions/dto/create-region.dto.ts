import { IsOptional, IsString } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
