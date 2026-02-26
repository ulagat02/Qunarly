export declare class AdminStuckItemDto {
    orderId: string;
    requestId: string;
    legId: string | null;
    legStatus: string;
    driverId: string | null;
    lastUpdatedAt: Date;
    reason: 'WAITING_PROOF' | 'LEG2_BLOCKED' | 'NO_DRIVER' | 'TIMEOUT';
}
