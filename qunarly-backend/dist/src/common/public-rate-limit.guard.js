"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
let PublicRateLimitGuard = class PublicRateLimitGuard {
    constructor() {
        this.windowMs = 60_000;
        this.maxRequests = 60;
        this.store = new Map();
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip || 'unknown';
        const key = `${ip}:${request.method}:${request.url}`;
        const now = Date.now();
        const entry = this.store.get(key);
        if (!entry || entry.resetAt <= now) {
            this.store.set(key, { count: 1, resetAt: now + this.windowMs });
            return true;
        }
        if (entry.count >= this.maxRequests) {
            throw new common_1.HttpException('Too many requests', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        entry.count += 1;
        return true;
    }
};
exports.PublicRateLimitGuard = PublicRateLimitGuard;
exports.PublicRateLimitGuard = PublicRateLimitGuard = __decorate([
    (0, common_1.Injectable)()
], PublicRateLimitGuard);
//# sourceMappingURL=public-rate-limit.guard.js.map