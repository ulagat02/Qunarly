import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { JarmenkeController } from './jarmenke.controller';
import { JarmenkeService } from './jarmenke.service';
import { JarmenkePricingService } from './pricing.service';

@Module({
  imports: [PrismaModule],
  controllers: [JarmenkeController],
  providers: [JarmenkeService, JarmenkePricingService],
  exports: [JarmenkePricingService],
})
export class JarmenkeModule {}
