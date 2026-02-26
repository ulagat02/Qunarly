import { FraudSignalStatus, FraudSignalType } from '@prisma/client';
export declare class AdminFraudSignalDto {
    type: FraudSignalType;
    orderId?: string;
    userId?: string;
    ipHash?: string;
    reason: string;
}
export declare class AdminFraudResolveDto {
    status: FraudSignalStatus;
    reason: string;
}
