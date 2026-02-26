export declare class CreateShipmentDto {
    dealId?: string;
    contractId?: string;
    originLat: number;
    originLng: number;
    originAddressText: string;
    originRegion: string;
    destLat: number;
    destLng: number;
    destAddressText: string;
    destRegion: string;
    cargoDescription?: string;
    cargoType: string;
    weightKg: number;
    volumeM3: number;
    packageType?: string;
    notes?: string;
    priceOffer?: number;
    cargoJson?: unknown;
}
