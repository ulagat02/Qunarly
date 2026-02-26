export declare class AdminCommissionAnomalyItemDto {
    orderId: string;
    expectedProductCommission?: number | null;
    expectedDeliveryCommission?: number | null;
    actualProductCommission?: number | null;
    actualDeliveryCommission?: number | null;
}
export declare class AdminCommissionAnomalyResponseDto {
    items: AdminCommissionAnomalyItemDto[];
}
