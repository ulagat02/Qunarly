"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketModule = void 0;
const common_1 = require("@nestjs/common");
const market_service_1 = require("./market.service");
const market_controller_1 = require("./market.controller");
const audit_module_1 = require("../audit/audit.module");
const files_module_1 = require("../files/files.module");
const notifications_module_1 = require("../notifications/notifications.module");
const logistics_module_1 = require("../logistics/logistics.module");
let MarketModule = class MarketModule {
};
exports.MarketModule = MarketModule;
exports.MarketModule = MarketModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, files_module_1.FilesModule, notifications_module_1.NotificationsModule, logistics_module_1.LogisticsModule],
        providers: [market_service_1.MarketService],
        controllers: [market_controller_1.MarketController],
    })
], MarketModule);
//# sourceMappingURL=market.module.js.map