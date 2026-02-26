# Duplicates and Fixes

## Duplicates

### None Confirmed

After analysis:

- **delivery vs deliveries**: NOT duplicate. `delivery` = leg operations (accept, start, arrive, complete, handoff). `deliveries` = list drivers per delivery request. Both are canonical.
- **orders /admin vs /orders**: Different purposes — `/orders` for buyer/seller, `/admin/orders` for admin list/detail. Both canonical.
- **hubs /hubs vs /admin/hubs**: `/hubs` for public nearby lookup; `/admin/hubs` for admin CRUD. Both canonical.

No endpoints to remove or merge based on duplication.

---

## Ambiguous Flows

### 1. Admin Service Stub vs Tests

**Issue**: `admin.service.ts` is largely stubbed (empty lists, no audit writes). `admin-super-admin.e2e-spec.ts` expects real reassign/unlock/cancel + AuditLog rows.

**Resolution**: Align `admin.service.ts` implementation with `ADMIN_API.md`. Replace stubs with real logic for: listOrders (cursor, filters), getOrder (commissionEntries, deliveryReasonStuck), listStuck, listAudit, cancelOrder, reassignLeg, unlockMainline. All write actions must call `AdminService.audit` and create AuditLog rows.

### 2. GET /admin/disputes and /admin/disputes/:id

**Issue**: Admin controller has no GET disputes endpoints. Frontend disputes pages expect them.

**Resolution**: Add GET /admin/disputes (list with cursor) and GET /admin/disputes/:id if OrderDispute model exists and ADMIN_API specifies. Otherwise document as future work.

### 3. Hub Schema vs DTO/API

**Issue**: Prisma `Hub` uses `radiusMeters`. ADMIN_API and hubs.service reference `radiusKm` and `normalizedName`. Schema has no normalizedName.

**Resolution**:
- Ensure DTO mapping: radiusKm ↔ radiusMeters (divide/multiply by 1000).
- If duplicate detection requires normalizedName: add migration for Hub.normalizedName (nullable string) and use in listHubDuplicates/merge logic.
- Deactivate hub: block when active routes/legs exist unless force=true with audit.

### 4. Idempotency on Order Create

**Issue**: Plan mentions ensuring idempotency on order create (idempotencyKey) is single path.

**Resolution**: Verify `OrdersService.createOrder` uses idempotencyKey consistently; no alternate paths that bypass it.

### 5. Gating Logic Ownership

**Issue**: Gating (leg2 blocked until leg1 handoff/complete) and proof (LEG_ARRIVED) must be enforced in one place.

**Resolution**: Keep all gating in `delivery.service.ts`. Proof requirements for handoff/complete already there. Do not duplicate in orders or elsewhere.

---

## Proposed Fixes Summary

| Item | Action |
|------|--------|
| Admin stubs | Replace with real logic per ADMIN_API |
| Admin disputes GET | Add endpoints or document future |
| Hub radiusKm/normalizedName | DTO mapping + optional migration |
| Idempotency order create | Single path verification |
| Gating | Single owner in delivery.service |
