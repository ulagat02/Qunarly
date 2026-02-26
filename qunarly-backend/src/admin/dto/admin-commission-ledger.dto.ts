import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCommissionLedgerItemDto {
  @ApiProperty()
  eventKey!: string;

  @ApiPropertyOptional()
  orderId?: string | null;

  @ApiPropertyOptional()
  legId?: string | null;

  @ApiPropertyOptional()
  amount?: number | null;

  @ApiPropertyOptional()
  rateApplied?: number | null;

  @ApiPropertyOptional()
  legFee?: number | null;

  @ApiPropertyOptional()
  createdAt?: Date | null;
}

export class AdminCommissionLedgerResponseDto {
  @ApiProperty({ type: [AdminCommissionLedgerItemDto] })
  items!: AdminCommissionLedgerItemDto[];
}
