export declare class AdminCommissionLedgerItemDto {
    eventKey: string;
    orderId?: string | null;
    legId?: string | null;
    amount?: number | null;
    rateApplied?: number | null;
    legFee?: number | null;
    createdAt?: Date | null;
}
export declare class AdminCommissionLedgerResponseDto {
    items: AdminCommissionLedgerItemDto[];
}
