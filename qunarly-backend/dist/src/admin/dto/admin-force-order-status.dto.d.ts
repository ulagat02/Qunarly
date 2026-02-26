import { OrderStatus } from '@prisma/client';
export declare class AdminForceOrderStatusDto {
    status: OrderStatus;
    reason: string;
    confirm: string;
}
