import { Module } from '@nestjs/common';
import { AddressPointsController } from './address-points.controller';
import { AddressPointsService } from './address-points.service';

@Module({
  controllers: [AddressPointsController],
  providers: [AddressPointsService],
})
export class AddressPointsModule {}
