export declare class UpdateQueueDto {
    routeId: string;
    status: 'IN_QUEUE' | 'OFFERED' | 'ON_TRIP' | 'OFFLINE';
    availableSeats?: number;
}
