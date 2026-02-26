import { ProofEntityType, ProofEventType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class ProofEventDto {
  @IsOptional()
  @IsString()
  eventKey?: string;

  @IsEnum(ProofEventType)
  eventType!: ProofEventType;

  @IsEnum(ProofEntityType)
  entityType!: ProofEntityType;

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsString()
  actorUserId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  deliveryId?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  legId?: string;

  @IsOptional()
  @IsString()
  handoffId?: string;

  @IsOptional()
  @IsString()
  dropPickId?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsDateString()
  clientCreatedAt?: string;

  @IsOptional()
  @IsObject()
  metaJson?: Record<string, unknown>;
}
