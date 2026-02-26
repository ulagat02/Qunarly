export declare class JarmenkePricingService {
    selectTier<T extends {
        minQty: number;
        maxQty: number | null;
        unitPrice: number;
        id: string;
        currency: string;
    }>(tiers: T[], qty: number): T | null;
    resolveUnitPrice<T extends {
        minQty: number;
        maxQty: number | null;
        unitPrice: number;
        id: string;
        currency: string;
    }>(tiers: T[], qty: number, fallbackPrice: number, fallbackCurrency: string): {
        appliedTierId: string | null;
        unitPrice: number;
        currency: string;
    };
    resolveCommissionRates(activeEvent?: {
        productRateOverridePercent?: number | null;
        deliveryRateOverridePercent?: number | null;
    }): {
        productRate: number;
        deliveryRate: number;
        source: "EVENT_OVERRIDE" | "DEFAULT";
    };
    resolveCommissionRatesWithOverrides(baseRates: {
        productRate: number;
        deliveryRate: number;
    } | null, activeEvent?: {
        productRateOverridePercent?: number | null;
        deliveryRateOverridePercent?: number | null;
    }): {
        source: "DEFAULT";
        productRate: number;
        deliveryRate: number;
    } | {
        productRate: number;
        deliveryRate: number;
        source: "EVENT_OVERRIDE";
    };
    calculateCommissionAmounts(productSubtotal: number, deliveryFee: number, productRate: number, deliveryRate: number): {
        productCommissionAmount: number;
        deliveryCommissionAmount: number;
    };
}
