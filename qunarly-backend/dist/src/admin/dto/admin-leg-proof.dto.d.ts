import { ProofEventType } from '@prisma/client';
export declare class AdminLegProofDto {
    eventType: ProofEventType;
    lat?: number;
    lng?: number;
    metaJson?: Record<string, unknown>;
    reason: string;
}
