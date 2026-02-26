import { OrderStatus } from '@prisma/client';
export declare class AdminOrderListItemDto {
    id: string;
    status: OrderStatus;
    totalAmount?: number | null;
    buyerId?: string | null;
    sellerId?: string | null;
    listingId?: string | null;
    listingTitle?: string | null;
    deliveryStatus?: string | null;
    createdAt: Date;
}
export declare class AdminOrderListResponseDto {
    items: AdminOrderListItemDto[];
    nextCursor?: string | null;
}
