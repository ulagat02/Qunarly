import { ApiProperty } from '@nestjs/swagger';

export class AdminStuckItemDto {
  @ApiProperty({ example: 'order-id' })
  orderId!: string;

  @ApiProperty({ example: 'request-id' })
  requestId!: string;

  @ApiProperty({ example: 'leg-id', nullable: true })
  legId!: string | null;

  @ApiProperty({ example: 'OFFERING' })
  legStatus!: string;

  @ApiProperty({ example: 'driver-id', nullable: true })
  driverId!: string | null;

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  lastUpdatedAt!: Date;

  @ApiProperty({ example: 'WAITING_PROOF' })
  reason!: 'WAITING_PROOF' | 'LEG2_BLOCKED' | 'NO_DRIVER' | 'TIMEOUT';
}
