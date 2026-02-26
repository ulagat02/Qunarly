import { Module } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { RegionsController } from './regions.controller';
import { DistrictsController } from './districts.controller';
import { VillagesController } from './villages.controller';

@Module({
  providers: [RegionsService],
  controllers: [RegionsController, DistrictsController, VillagesController],
})
export class RegionsModule {}
