import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RegionsModule } from './regions/regions.module';
import { FilesModule } from './files/files.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { MarketModule } from './market/market.module';
import { FieldModule } from './field/field.module';
import { LogisticsModule } from './logistics/logistics.module';
import { PrismaModule } from './common/prisma.module';
import { RolesGuard } from './common/roles.guard';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { AddressPointsModule } from './address-points/address-points.module';
import { DebugModule } from './debug/debug.module';
import { VillagesModule } from './villages/villages.module';
import { TaxiModule } from './taxi/taxi.module';
import { TripsModule } from './trips/trips.module';
import { HubsModule } from './hubs/hubs.module';
import { RoutesModule } from './routes/routes.module';
import { PresenceModule } from './presence/presence.module';
import { JarmenkeModule } from './jarmenke/jarmenke.module';
import { SuperAdminBootstrap } from './bootstrap/super-admin.bootstrap';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    RegionsModule,
    FilesModule,
    AuditModule,
    NotificationsModule,
    PaymentsModule,
    MarketModule,
    FieldModule,
    LogisticsModule,
    OrdersModule,
    DeliveryModule,
    AddressPointsModule,
    DebugModule,
    VillagesModule,
    TaxiModule,
    TripsModule,
    HealthModule,
    HubsModule,
    RoutesModule,
    PresenceModule,
    JarmenkeModule,
    AdminModule,
  ],
  providers: [RolesGuard, SuperAdminBootstrap],
})
export class AppModule {}
