import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCommissionEntryDto {
  @ApiPropertyOptional({ example: 'commission:delivery:orderId:legId:HANDOFF_COMPLETED' })
  eventKey?: string | null;

  @ApiPropertyOptional({ example: 'order-id' })
  orderId?: string | null;

  @ApiPropertyOptional({ example: 'leg-id' })
  legId?: string | null;

  @ApiPropertyOptional({ example: 7.5 })
  amount?: number | null;

  @ApiPropertyOptional({ example: 0.03 })
  rateApplied?: number | null;

  @ApiPropertyOptional({ example: 250 })
  legFee?: number | null;

  @ApiPropertyOptional({ example: '2026-02-12T10:00:00.000Z' })
  createdAt?: Date | null;
}

export class AdminOrderDetailDto {
  @ApiProperty({
    example: {
      id: 'order-id',
      status: 'PLACED',
      totalAmount: 1500,
    },
  })
  order!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: {
      id: 'request-id',
      status: 'LEG1',
    },
  })
  deliveryRequest?: Record<string, unknown> | null;

  @ApiProperty({
    type: [Object],
    example: [{ id: 'leg-id', status: 'OFFERING', price: 250 }],
  })
  legs!: Record<string, unknown>[];

  @ApiProperty({
    type: [Object],
    example: [{ id: 'proof-id', eventType: 'LEG_ARRIVED' }],
  })
  proofEvents!: Record<string, unknown>[];

  @ApiPropertyOptional({ example: 'WAITING_PROOF' })
  deliveryReasonStuck?: string | null;

  @ApiProperty({
    type: [AdminCommissionEntryDto],
    example: [
      {
        eventKey: 'commission:delivery:order-id:leg-id:HANDOFF_COMPLETED',
        orderId: 'order-id',
        legId: 'leg-id',
        amount: 7.5,
        rateApplied: 0.03,
        legFee: 250,
        createdAt: '2026-02-12T10:00:00.000Z',
      },
    ],
  })
  commissionEntries!: AdminCommissionEntryDto[];
}
