export declare class CreateRideRequestDto {
    routeId: string;
    pickupText: string;
    seats: number;
    cargoType: 'NONE' | 'SMALL' | 'LARGE';
    departureType: 'TODAY' | 'TOMORROW';
    waitUntilFull?: boolean;
    clientRequestId?: string;
}
