import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminAuditActorDto {
  @ApiPropertyOptional({ example: 'user-id' })
  id?: string | null;

  @ApiPropertyOptional({ example: 'user@example.com' })
  email?: string | null;

  @ApiPropertyOptional({ example: 'Admin User' })
  displayName?: string | null;
}

export class AdminAuditLogItemDto {
  @ApiProperty({ example: 'audit-id' })
  id!: string;

  @ApiProperty({ example: 'admin.order.cancel' })
  action!: string;

  @ApiPropertyOptional({ example: '2026-02-12T10:00:00.000Z' })
  createdAt?: Date | null;

  @ApiPropertyOptional({
    type: Object,
    example: { targetType: 'Order', targetId: 'order-id', reason: 'manual override' },
  })
  metaJson?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    type: AdminAuditActorDto,
    example: { id: 'user-id', email: 'admin@example.com', displayName: 'Бас Әкімші' },
  })
  actor?: AdminAuditActorDto | null;
}

export class AdminAuditLogResponseDto {
  @ApiProperty({ type: [AdminAuditLogItemDto] })
  items!: AdminAuditLogItemDto[];

  @ApiPropertyOptional({ example: 'audit-id' })
  nextCursor?: string | null;
}
