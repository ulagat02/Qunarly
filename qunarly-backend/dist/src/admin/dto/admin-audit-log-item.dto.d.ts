export declare class AdminAuditActorDto {
    id?: string | null;
    email?: string | null;
    displayName?: string | null;
}
export declare class AdminAuditLogItemDto {
    id: string;
    action: string;
    createdAt?: Date | null;
    metaJson?: Record<string, unknown> | null;
    actor?: AdminAuditActorDto | null;
}
export declare class AdminAuditLogResponseDto {
    items: AdminAuditLogItemDto[];
    nextCursor?: string | null;
}
