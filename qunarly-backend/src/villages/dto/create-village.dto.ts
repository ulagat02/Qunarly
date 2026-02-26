import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVillageDto {
  @IsString()
  @ApiProperty({ example: 'Нұрлы ауылы' })
  nameDisplay!: string;

  @IsString()
  @ApiProperty({ example: 'region-id' })
  regionId!: string;

  @IsString()
  @ApiProperty({ example: 'district-id' })
  districtId!: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 43.238949 })
  lat!: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 76.889709 })
  lng!: number;
}
