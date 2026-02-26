import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DeliveryController } from './delivery.controller';
import { DeliveriesController } from './deliveries.controller';
import { DriversController } from './drivers.controller';
import { DeliveryService } from './delivery.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DeliveryController, DeliveriesController, DriversController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
