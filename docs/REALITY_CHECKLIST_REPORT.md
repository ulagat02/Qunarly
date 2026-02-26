# Reality Checklist Report

## Scenarios Status

| Scenario | Description | Status |
|----------|-------------|--------|
| A | Village → Hub → City (2 legs), commission ledger eventKeys | Implemented in E2E; depends on DB/schema alignment |
| B | Hub origin → City (1 leg), price=1250 | Implemented in E2E |
| C | Stuck triage (WAITING_PROOF, LEG2_BLOCKED, NO_DRIVER, TIMEOUT) | listStuck implemented; E2E covers |
| D | Admin cancel/reassign/unlock + AuditLog | Implemented; AuditLog entries created |
| E | Infra duplicate hubs, rename, merge, deactivate | E2E scaffolded; full infra routes pending |

## Duplicates Resolved

Per DUPLICATES_AND_FIXES.md: No confirmed duplicates. delivery vs deliveries, orders vs admin/orders, hubs vs admin/hubs are distinct.

## Algorithm / Life Mismatches

- **Hub schema**: DB may have `radiusKm`/`normalizedName` from migration; schema.prisma uses `radiusMeters`. Tests use `radiusMeters` for compatibility.
- **Commission eventKey**: Delivery service uses `commission:delivery:{orderId}:{legId}:{eventType}`. E2E asserts this format.
- **Handoff proof**: LEG_ARRIVED proof required before handoff/complete. Enforced in delivery.service.

## Implemented in This Pass

- Admin cancel order, reassign leg, unlock mainline with AuditLog
- Admin listStuck with deterministic reason precedence
- ProofEvent and ShipmentJob.orderId added to schema for alignment with migrations
- E2E realworld-scenarios.e2e-spec.ts (Scenarios A–E)

## Recommended Next Steps

1. **SLA config**: Implement DeliverySlaConfig usage for TIMEOUT thresholds.
2. **Fraud signals**: Wire listFraudSignals, resolve endpoints.
3. **Exports**: Implement real CSV/PDF export for stats and commission ledger.
4. **Admin disputes**: Add GET /admin/disputes and GET /admin/disputes/:id if OrderDispute exists.
5. **Schema/DB sync**: Ensure all migrations are applied and schema.prisma matches DB; add Hub.normalizedName/radiusKm if migration applied.
6. **listOrders / listAudit**: Replace stubs with cursor-paginated real queries per ADMIN_API.
