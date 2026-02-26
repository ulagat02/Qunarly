export declare class AdminRateLimitDto {
    key: string;
    limit: number;
    windowSeconds: number;
    isActive?: boolean;
    reason: string;
}
