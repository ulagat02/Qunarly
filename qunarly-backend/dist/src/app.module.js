"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const profiles_module_1 = require("./profiles/profiles.module");
const regions_module_1 = require("./regions/regions.module");
const files_module_1 = require("./files/files.module");
const audit_module_1 = require("./audit/audit.module");
const notifications_module_1 = require("./notifications/notifications.module");
const payments_module_1 = require("./payments/payments.module");
const market_module_1 = require("./market/market.module");
const field_module_1 = require("./field/field.module");
const logistics_module_1 = require("./logistics/logistics.module");
const prisma_module_1 = require("./common/prisma.module");
const roles_guard_1 = require("./common/roles.guard");
const health_module_1 = require("./health/health.module");
const orders_module_1 = require("./orders/orders.module");
const delivery_module_1 = require("./delivery/delivery.module");
const address_points_module_1 = require("./address-points/address-points.module");
const debug_module_1 = require("./debug/debug.module");
const villages_module_1 = require("./villages/villages.module");
const taxi_module_1 = require("./taxi/taxi.module");
const trips_module_1 = require("./trips/trips.module");
const hubs_module_1 = require("./hubs/hubs.module");
const routes_module_1 = require("./routes/routes.module");
const presence_module_1 = require("./presence/presence.module");
const jarmenke_module_1 = require("./jarmenke/jarmenke.module");
const super_admin_bootstrap_1 = require("./bootstrap/super-admin.bootstrap");
const admin_module_1 = require("./admin/admin.module");
const schedule_1 = require("@nestjs/schedule");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            profiles_module_1.ProfilesModule,
            regions_module_1.RegionsModule,
            files_module_1.FilesModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            payments_module_1.PaymentsModule,
            market_module_1.MarketModule,
            field_module_1.FieldModule,
            logistics_module_1.LogisticsModule,
            orders_module_1.OrdersModule,
            delivery_module_1.DeliveryModule,
            address_points_module_1.AddressPointsModule,
            debug_module_1.DebugModule,
            villages_module_1.VillagesModule,
            taxi_module_1.TaxiModule,
            trips_module_1.TripsModule,
            health_module_1.HealthModule,
            hubs_module_1.HubsModule,
            routes_module_1.RoutesModule,
            presence_module_1.PresenceModule,
            jarmenke_module_1.JarmenkeModule,
            admin_module_1.AdminModule,
        ],
        providers: [roles_guard_1.RolesGuard, super_admin_bootstrap_1.SuperAdminBootstrap],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map