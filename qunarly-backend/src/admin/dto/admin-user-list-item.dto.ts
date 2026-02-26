import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class AdminUserListItemDto {
  @ApiProperty({ example: 'user-id' })
  id!: string;

  @ApiPropertyOptional({ example: 'User Name' })
  displayName?: string | null;

  @ApiPropertyOptional({ example: 'user@example.com' })
  email?: string | null;

  @ApiPropertyOptional({ example: '+77000000000' })
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ example: '2026-02-12T10:00:00.000Z' })
  createdAt!: Date;
}

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserListItemDto] })
  items!: AdminUserListItemDto[];

  @ApiPropertyOptional({ example: 'user-id' })
  nextCursor?: string | null;
}
