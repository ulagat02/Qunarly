# Admin API (freeze)

All endpoints require Super Admin auth (Bearer token).

## Read vs Write

- **READ (GET)**: All GET endpoints are read-only with no side effects. Safe to call for reporting, dashboards, and inspection.
- **WRITE (POST)**: All POST endpoints modify state. Each write action:
  - Requires `reason` in the request body (mandatory)
  - Creates an AuditLog entry with actor, action, target, and reason

No read endpoint has side effects on data. Export endpoints (GET `/admin/exports/*`) stream file data and do not persist changes.

## Cursor pagination
- `cursor` is a base64 JSON string: `{"createdAt":"ISO","id":"uuid"}`
- Ordering is always `createdAt DESC, id DESC`
- Response includes `nextCursor` or `null`

## Endpoints

### GET `/admin/stats`
- No params
- Returns KPIs + 7-day chart

### GET `/admin/exports/stats`
Query:
- `format=csv|pdf`

### GET `/admin/orders`
Query:
- `status`, `from`, `to`, `sellerId`, `buyerId`, `regionId`, `districtId`, `q`
- `limit`, `cursor`
Response:
- `{ items[], nextCursor }`

### GET `/admin/orders/:id`
- Returns order + delivery request + legs + proofs + `commissionEntries`

### GET `/admin/delivery/stuck`
- Returns items with `reason`:
  - `WAITING_PROOF`, `LEG2_BLOCKED`, `NO_DRIVER`, `TIMEOUT`

### POST `/admin/delivery/legs/:id/reassign`
Body:
- `{ driverId, reason }`

### POST `/admin/delivery/legs/:id/unlock-mainline`
Body:
- `{ reason }`

### POST `/admin/orders/:id/cancel`
Body:
- `{ reason }`

### POST `/admin/orders/:id/force-status`
Body:
- `{ status, reason, confirm: "FORCE" }`

### POST `/admin/orders/:id/dispute`
Body:
- `{ reason }`

### POST `/admin/orders/:id/dispute/resolve`
Body:
- `{ resolution, resolutionNote?, reason }`

### GET `/admin/disputes`
Query:
- `status`, `orderId`

### POST `/admin/orders/:id/refund-flag`
Body:
- `{ reason }`

### GET `/admin/slas`
- Returns SLA list

### POST `/admin/slas`
Body:
- `{ legSortOrder, minutes, isActive?, reason }`

### POST `/admin/slas/:id`
Body:
- `{ legSortOrder, minutes, isActive?, reason }`

### POST `/admin/delivery/legs/:id/force-complete`
Body:
- `{ confirm: "FORCE", reason }`

### POST `/admin/delivery/legs/:id/proof`
Body:
- `{ eventType, lat?, lng?, metaJson?, reason }`

### POST `/admin/delivery/legs/:id/adjust-geo`
Body:
- `{ arrivedLat, arrivedLng, arrivedHubId?, reason }`

### GET `/admin/audit`
Query:
- `action`, `actorUserId`, `from`, `to`, `limit`, `cursor`
Response:
- `{ items[], nextCursor }`

### GET `/admin/commission/ledger`
Query:
- `orderId`, `from`, `to`
Response:
- `{ items[] }`

### GET `/admin/exports/commission`
Query:
- `format=csv|pdf`, `orderId`, `from`, `to`

### GET `/admin/commission/anomalies`
Query:
- `from`, `to`
Response:
- `{ items[] }`

### GET `/admin/commission/config`
- Returns config list

### POST `/admin/commission/config`
Body:
- `{ scope, regionId?, category?, productRatePercent, deliveryRatePercent, effectiveFrom, effectiveTo?, isActive?, reason }`

### POST `/admin/commission/config/:id`
Body:
- `{ scope, regionId?, category?, productRatePercent, deliveryRatePercent, effectiveFrom, effectiveTo?, isActive?, reason }`

### GET `/admin/jarmenke/events`
- Returns event list

### POST `/admin/jarmenke/events`
Body:
- `{ startAt, endAt, productRateOverridePercent?, deliveryRateOverridePercent?, reason }`

### GET `/admin/access-list`
Query:
- `listType`, `targetType`

### POST `/admin/access-list`
Body:
- `{ listType, targetType, targetValue, reason }`

### POST `/admin/access-list/:id/remove`
Body:
- `{ reason }`

### GET `/admin/fraud/signals`
Query:
- `status`, `type`, `orderId`, `userId`

### POST `/admin/fraud/signals`
Body:
- `{ type, orderId?, userId?, ipHash?, reason }`

### POST `/admin/fraud/signals/:id/resolve`
Body:
- `{ status, reason }`

### GET `/admin/rate-limits`
- Returns rate limit list

### POST `/admin/rate-limits`
Body:
- `{ key, limit, windowSeconds, isActive?, reason }`

### POST `/admin/rate-limits/:id`
Body:
- `{ key, limit, windowSeconds, isActive?, reason }`

### GET `/admin/alerts`
- Returns alert config list

### POST `/admin/alerts`
Body:
- `{ key, threshold, isActive?, reason }`

### POST `/admin/alerts/:id`
Body:
- `{ key, threshold, isActive?, reason }`

### GET `/admin/playbooks`
- Returns incident playbooks

### POST `/admin/playbooks`
Body:
- `{ key, title, stepsMarkdown, isActive?, reason }`

### POST `/admin/playbooks/:id`
Body:
- `{ key, title, stepsMarkdown, isActive?, reason }`

### GET `/admin/hubs`
- Query:
  - `regionId`, `status=ACTIVE|INACTIVE`, `minRadiusKm`, `maxRadiusKm`, `duplicates=true|false`
- Returns hubs with `activeRouteCount`, `linkedDeliveryCount`, `isDuplicate`

### POST `/admin/hubs`
Body:
- `{ name, lat, lng, radiusKm?, regionId?, districtId?, isActive?, reason }`

### POST `/admin/hubs/:id`
Body:
- `{ name, lat, lng, radiusKm?, regionId?, districtId?, isActive?, reason }`

### POST `/admin/hubs/:id/rename`
Body:
- `{ name, reason }`

### POST `/admin/hubs/:id/deactivate`
Body:
- `{ reason, force? }`

### POST `/admin/hubs/:id/merge`
Body:
- `{ targetHubId, reason, force? }`

### GET `/admin/hubs/duplicates`
- Returns `{ primaryHubId, duplicateIds[] }[]`

### GET `/admin/hubs/:id/impact`
- Returns `{ activeRoutes, activeLegs }`

### GET `/admin/routes`
- Query:
  - `originHubId`, `destinationHubId`, `routeType`, `status`
- Returns routes with `usageCount`, `isActive`

### POST `/admin/routes`
Body:
- `{ fromHubId, toHubId, routeType, status?, label?, priority?, reason }`

### POST `/admin/routes/:id`
Body:
- `{ fromHubId, toHubId, routeType, status?, label?, priority?, reason }`

### POST `/admin/routes/:id/rename`
Body:
- `{ label, reason }`

### POST `/admin/routes/:id/toggle`
Body:
- `{ isActive, reason, force? }`

### POST `/admin/routes/:id/dedupe`
Body:
- `{ canonicalRouteId, reason, force? }`

### GET `/admin/routes/duplicates`
- Returns `{ canonicalRouteId, duplicateIds[] }[]`

### GET `/admin/routes/:id/impact`
- Returns `{ activeLegs }`

### GET `/admin/infra/health`
- Returns infra health counters

### GET `/admin/infra/orphans`
- Returns routes linked to missing/inactive hubs

### GET `/admin/users`
Query:
- `role`, `status`, `q`, `from`, `to`, `limit`, `cursor`
Response:
- `{ items[], nextCursor }`

### GET `/admin/users/:id`
- Returns user fields + counts
