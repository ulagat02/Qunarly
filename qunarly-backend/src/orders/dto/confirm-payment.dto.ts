import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const PAYMENT_PROVIDERS = ['KASPI_QR'] as const;
const PAYMENT_INTENT_STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED'] as const;

export class ConfirmPaymentDto {
  @IsString()
  @ApiProperty({ example: 'order-id' })
  orderId!: string;

  @IsIn(PAYMENT_PROVIDERS)
  @ApiProperty({ enum: PAYMENT_PROVIDERS, example: 'KASPI_QR' })
  provider!: (typeof PAYMENT_PROVIDERS)[number];

  @IsString()
  @ApiProperty({ example: 'external-ref' })
  externalRef!: string;

  @IsIn(PAYMENT_INTENT_STATUSES)
  @ApiProperty({ enum: PAYMENT_INTENT_STATUSES, example: 'CONFIRMED' })
  status!: (typeof PAYMENT_INTENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'idempotency-key' })
  idempotencyKey?: string;
}
