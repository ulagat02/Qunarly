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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const presence_service_1 = require("./presence.service");
let PresenceController = class PresenceController {
    constructor(presenceService) {
        this.presenceService = presenceService;
    }
    async resolveHub(lat, lng) {
        return this.presenceService.resolveHub(Number(lat), Number(lng));
    }
};
exports.PresenceController = PresenceController;
__decorate([
    (0, common_1.Get)('resolve-hub'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PresenceController.prototype, "resolveHub", null);
exports.PresenceController = PresenceController = __decorate([
    (0, swagger_1.ApiTags)('Presence'),
    (0, common_1.Controller)('presence'),
    __metadata("design:paramtypes", [presence_service_1.PresenceService])
], PresenceController);
//# sourceMappingURL=presence.controller.js.map