import { Module } from '@nestjs/common';
import { VillagesController } from './villages.controller';
import { VillagesService } from './villages.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VillagesController],
  providers: [VillagesService],
})
export class VillagesModule {}
