import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class AdminUserDetailDto {
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

  @ApiPropertyOptional({ example: '2026-02-12T10:00:00.000Z' })
  lastLoginAt?: Date | null;

  @ApiProperty({ example: 3 })
  ordersAsBuyer!: number;

  @ApiProperty({ example: 2 })
  ordersAsSeller!: number;

  @ApiProperty({ example: 1 })
  activeDeliveriesAsDriver!: number;

  @ApiProperty({ example: 42 })
  completedLegsAsDriver!: number;
}
