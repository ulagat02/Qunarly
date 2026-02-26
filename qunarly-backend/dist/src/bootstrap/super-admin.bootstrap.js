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
var SuperAdminBootstrap_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminBootstrap = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const bcrypt = require("bcryptjs");
const client_1 = require("@prisma/client");
let SuperAdminBootstrap = SuperAdminBootstrap_1 = class SuperAdminBootstrap {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SuperAdminBootstrap_1.name);
    }
    async onModuleInit() {
        const email = process.env.SUPER_ADMIN_EMAIL?.trim();
        const password = process.env.SUPER_ADMIN_PASSWORD?.trim();
        const name = process.env.SUPER_ADMIN_NAME?.trim();
        if (!email || !password) {
            this.logger.warn('SUPER_ADMIN_EMAIL/PASSWORD not set; skipping bootstrap');
            return;
        }
        const existing = await this.prisma.user.findFirst({
            where: { email },
        });
        const passwordHash = await bcrypt.hash(password, 10);
        if (existing) {
            if (existing.role === client_1.UserRole.SUPER_ADMIN) {
                this.logger.log('Super admin already exists; skipping');
                return;
            }
            await this.prisma.user.update({
                where: { id: existing.id },
                data: {
                    role: client_1.UserRole.SUPER_ADMIN,
                    passwordHash,
                    displayName: name ?? existing.displayName ?? 'Бас Әкімші',
                    homeAddressText: existing.homeAddressText ?? 'Admin bootstrap',
                    homeRegion: existing.homeRegion ?? 'N/A',
                    homeLat: existing.homeLat ?? 0,
                    homeLng: existing.homeLng ?? 0,
                    homeUpdatedAt: new Date(),
                },
            });
            this.logger.log('Super admin updated for existing user');
            return;
        }
        await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                role: client_1.UserRole.SUPER_ADMIN,
                displayName: name ?? 'Бас Әкімші',
                homeAddressText: 'Admin bootstrap',
                homeRegion: 'N/A',
                homeLat: 0,
                homeLng: 0,
                homeUpdatedAt: new Date(),
            },
        });
        this.logger.log('Super admin created');
    }
};
exports.SuperAdminBootstrap = SuperAdminBootstrap;
exports.SuperAdminBootstrap = SuperAdminBootstrap = SuperAdminBootstrap_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuperAdminBootstrap);
//# sourceMappingURL=super-admin.bootstrap.js.map