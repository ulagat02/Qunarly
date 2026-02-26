export declare class AdminCommissionEntryDto {
    eventKey?: string | null;
    orderId?: string | null;
    legId?: string | null;
    amount?: number | null;
    rateApplied?: number | null;
    legFee?: number | null;
    createdAt?: Date | null;
}
export declare class AdminOrderDetailDto {
    order: Record<string, unknown>;
    deliveryRequest?: Record<string, unknown> | null;
    legs: Record<string, unknown>[];
    proofEvents: Record<string, unknown>[];
    deliveryReasonStuck?: string | null;
    commissionEntries: AdminCommissionEntryDto[];
}
