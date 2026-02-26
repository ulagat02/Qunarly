# Qunarly Ops Manual

## Admin Login and SUPER_ADMIN Bootstrap

- Admin login: POST `/auth/login` with email/password. Requires user role `SUPER_ADMIN`.
- Bootstrap: Ensure `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME` env vars are set. On app init, a Super Admin user is created/updated if missing.
- All admin endpoints require Bearer token (JWT) with Super Admin role.

## Read vs Write Endpoints; Reason Requirement

- **READ (GET)**: Safe, no side effects. Used for dashboards, reporting, inspection.
- **WRITE (POST)**: Every write action:
  - **Requires `reason`** in the request body (mandatory)
  - Creates an AuditLog entry with actor, action, target, and reason

No read endpoint modifies data. Export endpoints (GET `/admin/exports/*`) stream files and do not persist changes.

## Stuck Triage

Admin `/admin/delivery/stuck` returns legs/deliveries that are not progressing. Reasons (precedence):

1. **WAITING_PROOF** – Leg ARRIVED at hub but no LEG_ARRIVED proof; handoff cannot complete.
2. **LEG2_BLOCKED** – Leg2 ACCEPTED with driverId=null; waiting for leg1 handoff.
3. **NO_DRIVER** – Leg OFFERING with no driver.
4. **TIMEOUT** – Leg STARTED or ARRIVED but stale (>60 min).

Actions: `unlock-mainline` (unblock leg2), `reassign` (assign different driver), `force-complete` (admin override), or `proof` (attach proof manually).

## Relay Rules

- **2 legs** (village → hub → city): Origin outside hub radius. Leg1 fee 250, Leg2 fee 1250. Leg2 blocked until leg1 handoff/complete with LEG_ARRIVED proof.
- **1 leg** (hub → city): Origin inside hub radius. Single mainline leg fee 1250.

Pricing and gating live in `orders.service` (leg creation) and `delivery.service` (handoff gating).

## Hub: Rename, Merge, Deactivate

- **Rename**: Normalize hub name for duplicate detection. Not yet fully implemented.
- **Merge**: Point routes from source hub to target; deactivate source. Requires impact preview.
- **Deactivate**: Block when active routes/legs exist unless `force=true` with audit. Prefer merge over deactivate when duplicates exist.

## Route: Toggle, Dedupe

- **Toggle**: Enable/disable route (ACTIVE/INACTIVE). Inactive routes are excluded from relay hub resolution.
- **Dedupe**: Merge duplicate routes (same fromHubId, toHubId, routeType).

## Commission Ledger

- Commission is **ledger-only** via ProofEvent `metaJson`. EventKey format: `commission:delivery:{orderId}:{legId}:{eventType}`.
- No in-app transactions; ProofEvent rows are the source of truth for commission accounting.
- Idempotent: duplicate eventKey skips write.
