import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class AdminOrderListItemDto {
  @ApiProperty({ example: 'order-id' })
  id!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiPropertyOptional({ example: 1500 })
  totalAmount?: number | null;

  @ApiPropertyOptional({ example: 'buyer-id' })
  buyerId?: string | null;

  @ApiPropertyOptional({ example: 'seller-id' })
  sellerId?: string | null;

  @ApiPropertyOptional({ example: 'listing-id' })
  listingId?: string | null;

  @ApiPropertyOptional({ example: 'Wheat' })
  listingTitle?: string | null;

  @ApiPropertyOptional({ example: 'CREATED' })
  deliveryStatus?: string | null;

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  createdAt!: Date;
}

export class AdminOrderListResponseDto {
  @ApiProperty({ type: [AdminOrderListItemDto] })
  items!: AdminOrderListItemDto[];

  @ApiPropertyOptional({ example: 'order-id' })
  nextCursor?: string | null;
}
