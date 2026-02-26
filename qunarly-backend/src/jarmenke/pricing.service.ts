import { Injectable } from '@nestjs/common';
import { CommissionSource } from '@prisma/client';

@Injectable()
export class JarmenkePricingService {
  selectTier<T extends { minQty: number; maxQty: number | null; unitPrice: number; id: string; currency: string }>(
    tiers: T[],
    qty: number,
  ) {
    const eligible = tiers.filter((tier) => qty >= tier.minQty && (tier.maxQty == null || qty <= tier.maxQty));
    if (!eligible.length) return null;
    return eligible.reduce((best, tier) => (tier.minQty > best.minQty ? tier : best), eligible[0]);
  }

  resolveUnitPrice<T extends { minQty: number; maxQty: number | null; unitPrice: number; id: string; currency: string }>(
    tiers: T[],
    qty: number,
    fallbackPrice: number,
    fallbackCurrency: string,
  ) {
    const tier = this.selectTier(tiers, qty);
    return {
      appliedTierId: tier?.id ?? null,
      unitPrice: tier?.unitPrice ?? fallbackPrice,
      currency: tier?.currency ?? fallbackCurrency,
    };
  }

  resolveCommissionRates(activeEvent?: {
    productRateOverridePercent?: number | null;
    deliveryRateOverridePercent?: number | null;
  }) {
    const productRate =
      activeEvent?.productRateOverridePercent != null ? activeEvent.productRateOverridePercent / 100 : 0.03;
    const deliveryRate =
      activeEvent?.deliveryRateOverridePercent != null ? activeEvent.deliveryRateOverridePercent / 100 : 0.03;
    const source = activeEvent ? CommissionSource.EVENT_OVERRIDE : CommissionSource.DEFAULT;
    return { productRate, deliveryRate, source };
  }

  resolveCommissionRatesWithOverrides(
    baseRates: { productRate: number; deliveryRate: number } | null,
    activeEvent?: { productRateOverridePercent?: number | null; deliveryRateOverridePercent?: number | null },
  ) {
    const fallback = baseRates ?? { productRate: 0.03, deliveryRate: 0.03 };
    if (!activeEvent) {
      return { ...fallback, source: CommissionSource.DEFAULT };
    }
    const productRate =
      activeEvent.productRateOverridePercent != null ? activeEvent.productRateOverridePercent / 100 : fallback.productRate;
    const deliveryRate =
      activeEvent.deliveryRateOverridePercent != null ? activeEvent.deliveryRateOverridePercent / 100 : fallback.deliveryRate;
    return { productRate, deliveryRate, source: CommissionSource.EVENT_OVERRIDE };
  }

  calculateCommissionAmounts(productSubtotal: number, deliveryFee: number, productRate: number, deliveryRate: number) {
    return {
      productCommissionAmount: Number((productSubtotal * productRate).toFixed(2)),
      deliveryCommissionAmount: Number((deliveryFee * deliveryRate).toFixed(2)),
    };
  }
}
