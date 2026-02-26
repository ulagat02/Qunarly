import { PriceTierDto } from './price-tier.dto';
export declare class CreateListingDto {
    title: string;
    description?: string;
    category: string;
    customCategoryName?: string;
    quantity: number;
    unit: string;
    price: number;
    currency: string;
    priceType?: string;
    districtId?: string;
    addressText: string;
    imageFileIds?: string[];
    imageUrls?: string[];
    images?: string[];
    tiers?: PriceTierDto[];
}
