import { IsOptional, IsString } from 'class-validator';

export class CreateFileDto {
  @IsString()
  type!: string;

  @IsString()
  url!: string;

  @IsOptional()
  metaJson?: unknown;
}
