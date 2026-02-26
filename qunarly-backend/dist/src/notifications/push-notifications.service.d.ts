export declare class PushNotificationsService {
    private expo;
    private readonly logger;
    sendPushNotification(token: string, title: string, body: string, data?: any): Promise<void>;
}
