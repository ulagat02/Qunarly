export declare class OrderItemInputDto {
    listingId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    idempotencyKey: string;
    items?: OrderItemInputDto[];
    listingId?: string;
    quantity?: number;
    deliveryFee?: number;
    deliveryOption?: string;
    destinationText: string;
    destLat?: number;
    destLng?: number;
}
