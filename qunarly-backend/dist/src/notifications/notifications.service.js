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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const expo_server_sdk_1 = require("expo-server-sdk");
const prisma_service_1 = require("../common/prisma.service");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.expo = new expo_server_sdk_1.Expo();
    }
    async listForUser(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
    async markRead(userId, id) {
        const notification = await this.prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    async updateStatus(userId, id, status) {
        const notification = await this.prisma.notification.findUnique({ where: { id } });
        if (!notification || notification.userId !== userId) {
            throw new common_1.NotFoundException('Notification not found');
        }
        if (status === 'DISMISSED' || status === 'READ') {
            return this.prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });
        }
        if (status === 'ACTIVE') {
            return this.prisma.notification.update({
                where: { id },
                data: { isRead: false },
            });
        }
        return notification;
    }
    async createForUsers(userIds, payload) {
        const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
        if (!uniqueIds.length) {
            return [];
        }
        const existing = await this.prisma.user.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true },
        });
        const existingIds = existing.map((user) => user.id);
        if (!existingIds.length) {
            return [];
        }
        await this.prisma.notification.createMany({
            data: existingIds.map((userId) => ({
                userId,
                type: payload.type,
                title: payload.title,
                body: payload.body,
                dataJson: payload.dataJson ?? undefined,
            })),
        });
        return [];
    }
    async sendPushToUsers(userIds, payload) {
        const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
        if (!uniqueIds.length) {
            return;
        }
        const users = await this.prisma.user.findMany({
            where: { id: { in: uniqueIds }, expoPushToken: { not: null } },
            select: { expoPushToken: true },
        });
        const tokens = users.map((user) => user.expoPushToken).filter(Boolean);
        if (!tokens.length) {
            console.log('[Push] no tokens for users', uniqueIds.length);
            return;
        }
        console.log('[Push] sending', { users: uniqueIds.length, tokens: tokens.length, title: payload.title });
        await this.sendPushToTokens(tokens, payload);
    }
    async sendPushToTokens(tokens, payload) {
        const messages = [];
        for (const token of tokens) {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
                continue;
            }
            messages.push({
                to: token,
                sound: 'default',
                title: payload.title,
                body: payload.body,
                data: payload.data ?? {},
            });
        }
        if (!messages.length) {
            return;
        }
        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const tickets = await this.expo.sendPushNotificationsAsync(chunk);
                const errors = tickets.filter((ticket) => ticket.status === 'error');
                if (errors.length) {
                    console.log('[Push] ticket errors', errors);
                }
            }
            catch (error) {
                console.log('[Push] send failed', error);
            }
        }
    }
    async updatePushToken(userId, token) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { expoPushToken: token ?? null },
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map