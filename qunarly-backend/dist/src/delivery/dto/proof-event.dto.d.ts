import { ProofEntityType, ProofEventType } from '@prisma/client';
export declare class ProofEventDto {
    eventKey?: string;
    eventType: ProofEventType;
    entityType: ProofEntityType;
    entityId: string;
    actorUserId?: string;
    orderId?: string;
    deliveryId?: string;
    requestId?: string;
    legId?: string;
    handoffId?: string;
    dropPickId?: string;
    lat?: number;
    lng?: number;
    clientCreatedAt?: string;
    metaJson?: Record<string, unknown>;
}
