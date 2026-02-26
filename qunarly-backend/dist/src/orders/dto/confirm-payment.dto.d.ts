declare const PAYMENT_PROVIDERS: readonly ["KASPI_QR"];
declare const PAYMENT_INTENT_STATUSES: readonly ["PENDING", "CONFIRMED", "FAILED", "EXPIRED"];
export declare class ConfirmPaymentDto {
    orderId: string;
    provider: (typeof PAYMENT_PROVIDERS)[number];
    externalRef: string;
    status: (typeof PAYMENT_INTENT_STATUSES)[number];
    idempotencyKey?: string;
}
export {};
