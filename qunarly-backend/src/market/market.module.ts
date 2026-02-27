import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [AuditModule, FilesModule, NotificationsModule, OrdersModule],
  providers: [MarketService],
  controllers: [MarketController],
})
export class MarketModule {}
