import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCommissionAnomalyItemDto {
  @ApiProperty()
  orderId!: string;

  @ApiPropertyOptional()
  expectedProductCommission?: number | null;

  @ApiPropertyOptional()
  expectedDeliveryCommission?: number | null;

  @ApiPropertyOptional()
  actualProductCommission?: number | null;

  @ApiPropertyOptional()
  actualDeliveryCommission?: number | null;
}

export class AdminCommissionAnomalyResponseDto {
  @ApiProperty({ type: [AdminCommissionAnomalyItemDto] })
  items!: AdminCommissionAnomalyItemDto[];
}
