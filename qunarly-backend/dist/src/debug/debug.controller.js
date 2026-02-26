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
exports.DebugController = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const prisma_service_1 = require("../common/prisma.service");
const getEnvSummary = () => {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    let dbHost = 'unknown';
    let dbPort = 'unknown';
    let dbName = 'unknown';
    let dbSchema = 'public';
    if (databaseUrl) {
        try {
            const url = new URL(databaseUrl);
            dbHost = url.hostname || dbHost;
            dbPort = url.port || dbPort;
            dbName = url.pathname.replace(/^\//, '') || dbName;
            dbSchema = url.searchParams.get('schema') || dbSchema;
        }
        catch {
        }
    }
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const publicBaseUrl = process.env.APP_BASE_URL || process.env.BASE_URL || process.env.PUBLIC_BASE_URL || null;
    return {
        dbHost,
        dbPort,
        dbName,
        dbSchema,
        uploadsDir,
        publicBaseUrl,
    };
};
let DebugController = class DebugController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getEnv() {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.NotFoundException();
        }
        return getEnvSummary();
    }
    async listUsers() {
        if (process.env.NODE_ENV === 'production') {
            throw new common_1.NotFoundException();
        }
        return this.prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });
    }
};
exports.DebugController = DebugController;
__decorate([
    (0, common_1.Get)('env'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DebugController.prototype, "getEnv", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DebugController.prototype, "listUsers", null);
exports.DebugController = DebugController = __decorate([
    (0, common_1.Controller)('debug'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DebugController);
//# sourceMappingURL=debug.controller.js.map