# Schema Sync Report

## Final Schema Decisions

### Enums added/kept
- `UserRole`: SUPER_ADMIN, WHOLESALE_BUYER (existing)
- `DisputeStatus`, `AccessListType`, `AccessListTarget`, `CommissionScope` (admin models)
- `ProofEventType`, `ProofEntityType` (ProofEvent)

### Models added (admin phase)
- `OrderDispute`, `RefundFlag` — dispute/refund flags per order
- `DeliverySlaConfig`, `AccessListEntry`, `AlertConfig`, `IncidentPlaybook`
- `CommissionConfig`, `RateLimitPolicy`
- Relations: Order.disputes, Order.refundFlags, User.orderDisputesOpened, User.orderDisputesClosed, User.refundFlagsCreated

### Schema/DB alignment
- `DeliveryLeg.handedOffAt` — re-added via migration (was dropped in 20260210204500)
- Admin DTOs import Prisma enums (DisputeResolution, etc.) — enums exported via OrderDispute/RefundFlag usage

## Migrations Created

| Migration | Purpose |
|-----------|---------|
| `20260213000000_add_delivery_leg_handed_off_at` | Add `handedOffAt` column back to DeliveryLeg (schema/code expected it, DB had dropped it) |

## Commands to Reproduce

```bash
cd qunarly-backend

# Validate schema
npx prisma validate

# Apply migrations (dev DB)
npx prisma migrate dev

# Apply migrations (test DB)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qunarly_test?schema=public" npx prisma migrate deploy

# Generate client
npx prisma generate

# Build
npm run build

# Run E2E suites
npm run test:e2e -- --testPathPattern="realworld-scenarios" --runInBand
npm run test:e2e -- --testPathPattern="full-scenario" --runInBand
npm run test:e2e -- --testPathPattern="admin-super-admin|admin-stats|admin-audit|admin-users" --runInBand
```

## Test Output (PASS)

```
PASS test/e2e/realworld-scenarios.e2e-spec.ts (5.353 s)
PASS test/e2e/admin-super-admin.e2e-spec.ts
PASS test/e2e/full-scenario.e2e-spec.ts
PASS test/e2e/admin-users.e2e-spec.ts
PASS test/e2e/admin-audit.e2e-spec.ts
PASS test/e2e/admin-stats.e2e-spec.ts

Test Suites: 6 passed, 6 total
Tests:       16 passed, 16 total
```

## Code Changes Summary

1. **Schema**: Added OrderDispute, RefundFlag, DeliverySlaConfig, AccessListEntry, AlertConfig, IncidentPlaybook, CommissionConfig, RateLimitPolicy; enums DisputeStatus, AccessListType, AccessListTarget, CommissionScope; relations on Order/User.
2. **Migration**: `20260213000000_add_delivery_leg_handed_off_at` to add handedOffAt.
3. **Admin service**: Implemented listOrders, listAudit, listUsers, getStats, getUserDetail (replacing stubs).
4. **E2E cleanup**: Delete OrderDispute, RefundFlag, CommissionRecord before Order in afterAll.
5. **E2E arrive**: Use leg.toHubId to resolve arrive coordinates (avoids geofence failures when relay picks a different hub).
6. **ArriveLegDto**: Added @Type(() => Number) for lat/lng transformation.
7. **realworld-scenarios**: ValidationPipe, dynamic arrive coords for Scenario A and C.
