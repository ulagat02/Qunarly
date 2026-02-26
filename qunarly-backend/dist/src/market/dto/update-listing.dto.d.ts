import { CreateListingDto } from './create-listing.dto';
import { ProductListingStatus } from '@prisma/client';
import { PriceTierDto } from './price-tier.dto';
declare const UpdateListingDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateListingDto>>;
export declare class UpdateListingDto extends UpdateListingDto_base {
    status?: ProductListingStatus;
    imageFileIds?: string[];
    tiers?: PriceTierDto[];
}
export {};
