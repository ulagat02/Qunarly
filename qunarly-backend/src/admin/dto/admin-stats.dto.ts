import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDayDto {
  @ApiProperty({ example: '2026-02-12' })
  day!: string;

  @ApiProperty({ example: 12 })
  orders!: number;

  @ApiProperty({ example: 8 })
  deliveries!: number;

  @ApiProperty({ example: 2 })
  stuck!: number;
}

export class AdminStatsDto {
  @ApiProperty({ example: 3 })
  ordersToday!: number;

  @ApiProperty({ example: 21 })
  orders7d!: number;

  @ApiProperty({ example: 5 })
  activeDeliveries!: number;

  @ApiProperty({ example: 1 })
  stuckDeliveries!: number;

  @ApiProperty({ example: 225 })
  commissionToday!: number;

  @ApiProperty({ example: 980 })
  commission7d!: number;

  @ApiProperty({
    type: [AdminStatsDayDto],
    example: [
      { day: '2026-02-06', orders: 4, deliveries: 3, stuck: 1 },
      { day: '2026-02-07', orders: 2, deliveries: 2, stuck: 0 },
    ],
  })
  chart7d!: AdminStatsDayDto[];
}
