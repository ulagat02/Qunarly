"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JarmenkePricingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let JarmenkePricingService = class JarmenkePricingService {
    selectTier(tiers, qty) {
        const eligible = tiers.filter((tier) => qty >= tier.minQty && (tier.maxQty == null || qty <= tier.maxQty));
        if (!eligible.length)
            return null;
        return eligible.reduce((best, tier) => (tier.minQty > best.minQty ? tier : best), eligible[0]);
    }
    resolveUnitPrice(tiers, qty, fallbackPrice, fallbackCurrency) {
        const tier = this.selectTier(tiers, qty);
        return {
            appliedTierId: tier?.id ?? null,
            unitPrice: tier?.unitPrice ?? fallbackPrice,
            currency: tier?.currency ?? fallbackCurrency,
        };
    }
    resolveCommissionRates(activeEvent) {
        const productRate = activeEvent?.productRateOverridePercent != null ? activeEvent.productRateOverridePercent / 100 : 0.03;
        const deliveryRate = activeEvent?.deliveryRateOverridePercent != null ? activeEvent.deliveryRateOverridePercent / 100 : 0.03;
        const source = activeEvent ? client_1.CommissionSource.EVENT_OVERRIDE : client_1.CommissionSource.DEFAULT;
        return { productRate, deliveryRate, source };
    }
    resolveCommissionRatesWithOverrides(baseRates, activeEvent) {
        const fallback = baseRates ?? { productRate: 0.03, deliveryRate: 0.03 };
        if (!activeEvent) {
            return { ...fallback, source: client_1.CommissionSource.DEFAULT };
        }
        const productRate = activeEvent.productRateOverridePercent != null ? activeEvent.productRateOverridePercent / 100 : fallback.productRate;
        const deliveryRate = activeEvent.deliveryRateOverridePercent != null ? activeEvent.deliveryRateOverridePercent / 100 : fallback.deliveryRate;
        return { productRate, deliveryRate, source: client_1.CommissionSource.EVENT_OVERRIDE };
    }
    calculateCommissionAmounts(productSubtotal, deliveryFee, productRate, deliveryRate) {
        return {
            productCommissionAmount: Number((productSubtotal * productRate).toFixed(2)),
            deliveryCommissionAmount: Number((deliveryFee * deliveryRate).toFixed(2)),
        };
    }
};
exports.JarmenkePricingService = JarmenkePricingService;
exports.JarmenkePricingService = JarmenkePricingService = __decorate([
    (0, common_1.Injectable)()
], JarmenkePricingService);
//# sourceMappingURL=pricing.service.js.map