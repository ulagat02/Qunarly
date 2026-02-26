"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PushNotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationsService = void 0;
const common_1 = require("@nestjs/common");
const expo_server_sdk_1 = require("expo-server-sdk");
let PushNotificationsService = PushNotificationsService_1 = class PushNotificationsService {
    constructor() {
        this.expo = new expo_server_sdk_1.Expo();
        this.logger = new common_1.Logger(PushNotificationsService_1.name);
    }
    async sendPushNotification(token, title, body, data) {
        if (!expo_server_sdk_1.Expo.isExpoPushToken(token)) {
            this.logger.error(`Push token ${token} is not a valid Expo push token`);
            return;
        }
        const messages = [
            {
                to: token,
                sound: 'default',
                title,
                body,
                data,
                priority: 'high',
            },
        ];
        try {
            const chunks = this.expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
                this.logger.log(`Push notification sent: ${JSON.stringify(ticketChunk)}`);
            }
        }
        catch (error) {
            this.logger.error(`Error sending push notification: ${error}`);
        }
    }
};
exports.PushNotificationsService = PushNotificationsService;
exports.PushNotificationsService = PushNotificationsService = PushNotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], PushNotificationsService);
//# sourceMappingURL=push-notifications.service.js.map