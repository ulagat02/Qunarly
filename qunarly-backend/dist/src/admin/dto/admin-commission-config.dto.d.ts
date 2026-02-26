import { CommissionScope } from '@prisma/client';
export declare class AdminCommissionConfigDto {
    scope: CommissionScope;
    regionId?: string;
    category?: string;
    productRatePercent: number;
    deliveryRatePercent: number;
    effectiveFrom: string;
    effectiveTo?: string;
    isActive?: boolean;
    reason: string;
}
