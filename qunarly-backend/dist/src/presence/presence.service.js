"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
const hubs_service_1 = require("../hubs/hubs.service");
let PresenceService = class PresenceService {
    constructor(hubsService) {
        this.hubsService = hubsService;
    }
    async resolveHub(lat, lng) {
        const nearest = await this.hubsService.findNearest(lat, lng);
        if (!nearest) {
            return { confidence: 'NONE', hubId: null, nearby: [] };
        }
        const nearby = await this.hubsService.listNearby(lat, lng, 5000);
        const top3 = nearby.slice(0, 3);
        if (nearest.distanceM <= nearest.radiusKm * 1000) {
            return {
                confidence: 'HIGH',
                hubId: nearest.id,
                hubName: nearest.name,
                distanceM: nearest.distanceM,
                nearby: top3,
            };
        }
        return {
            confidence: 'LOW',
            hubId: null,
            nearby: top3,
        };
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hubs_service_1.HubsService])
], PresenceService);
//# sourceMappingURL=presence.service.js.map