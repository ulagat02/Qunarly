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
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
let RateLimitService = class RateLimitService {
    constructor(prisma) {
        this.prisma = prisma;
        this.store = new Map();
    }
    async check(key, identity) {
        const rule = await this.prisma.rateLimitRule.findUnique({ where: { key } });
        if (!rule || !rule.isActive)
            return;
        const now = Date.now();
        const bucketKey = `${key}:${identity}`;
        const entry = this.store.get(bucketKey);
        if (!entry || entry.resetAt <= now) {
            this.store.set(bucketKey, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
            return;
        }
        if (entry.count >= rule.limit) {
            throw new common_1.HttpException('Too many requests', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        entry.count += 1;
        this.store.set(bucketKey, entry);
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map