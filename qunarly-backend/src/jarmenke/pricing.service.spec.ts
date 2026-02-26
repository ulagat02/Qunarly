import { JarmenkePricingService } from './pricing.service';

describe('JarmenkePricingService', () => {
  const service = new JarmenkePricingService();

  it('selects the highest eligible tier', () => {
    const tiers = [
      { id: 't1', minQty: 10, maxQty: 99, unitPrice: 120, currency: 'KZT' },
      { id: 't2', minQty: 100, maxQty: 499, unitPrice: 110, currency: 'KZT' },
      { id: 't3', minQty: 500, maxQty: null, unitPrice: 100, currency: 'KZT' },
    ];
    expect(service.selectTier(tiers, 120)?.id).toBe('t2');
    expect(service.selectTier(tiers, 600)?.id).toBe('t3');
  });

  it('falls back to retail price when no tier matches', () => {
    const tiers = [{ id: 't1', minQty: 50, maxQty: 99, unitPrice: 120, currency: 'KZT' }];
    const resolved = service.resolveUnitPrice(tiers, 10, 150, 'KZT');
    expect(resolved.appliedTierId).toBeNull();
    expect(resolved.unitPrice).toBe(150);
  });

  it('calculates commission amounts', () => {
    const amounts = service.calculateCommissionAmounts(10000, 2000, 0.03, 0.03);
    expect(amounts.productCommissionAmount).toBe(300);
    expect(amounts.deliveryCommissionAmount).toBe(60);
  });
});
