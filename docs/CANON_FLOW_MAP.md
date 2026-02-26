# Qunarly Function/Endpoint Canon Map

Single source of truth for domains, endpoints, service methods, DB models, and UI.

## Domain: Auth

| Endpoint | Method | Service | DB Models | UI |
|----------|--------|---------|-----------|-----|
| /auth/register | POST | AuthService.register | User, (CarrierProfile) | - |
| /auth/login | POST | AuthService.login | User, RefreshToken | Admin login |
| /auth/refresh | POST | AuthService.refresh | RefreshToken | - |
| /auth/dev-login | POST | AuthService.devLogin | User | Dev only |

---

## Domain: Listings (Market)

| Endpoint | Method | Service | DB Models | UI |
|----------|--------|---------|-----------|-----|
| /market/listings | POST | MarketService.create | ProductListing | - |
| /market/listings | GET | MarketService.list | ProductListing | - |
| /market/listings/:id | GET | MarketService.get | ProductListing | - |
| /market/listings/:id/preview | GET | MarketService | ProductListing | - |
| /market/listings/:id | PATCH | MarketService.update | ProductListing | - |
| /market/listings/:id/images | POST | MarketService | ProductListing, ListingImage, File | - |
| /market/listings/:id/offers | POST | MarketService | Offer | - |
| /market/listings/:id/offers | GET | MarketService | Offer | - |
| /market/offers/:id/accept | POST | MarketService.acceptOffer | Offer, Deal | - |
| /market/offers/:id/counter | POST | MarketService | Offer | - |
| /market/offers/:id/reject | POST | MarketService | Offer | - |
| /market/deals | GET | MarketService | Deal | - |
| /market/deals/:id | GET | MarketService | Deal | - |
| /market/deals/:id/confirm | POST | MarketService | Deal | - |
| /market/deals/:id/open-logistics | POST | MarketService | Deal, ShipmentJob | - |

---

## Domain: Orders

| Endpoint | Method | Service | DB Models | UI |
|----------|--------|---------|-----------|-----|
| /orders | POST | OrdersService.createOrder | Order, DeliveryRequest, Delivery, DeliveryLeg, CommissionRecord | - |
| /orders/my | GET | OrdersService | Order | - |
| /orders/:id | GET | OrdersService.getOrder | Order, Delivery, DeliveryLeg | Admin order detail |

**Canonical flow**: Listing -> POST /orders -> DeliveryRequest + DeliveryLegs (relay 250+1250 or 1250).

---

## Domain: Delivery (Relay Legs)

| Endpoint | Method | Service | DB Models | UI |
|----------|--------|---------|-----------|-----|
| /delivery/legs/available | GET | DeliveryService.listAvailable | DeliveryLeg | - |
| /delivery/legs/mine | GET | DeliveryService.listMine | DeliveryLeg | - |
| /delivery/legs/:id/accept | POST | DeliveryService.acceptLeg | DeliveryLeg | - |
| /delivery/legs/:id/reject | POST | DeliveryService.rejectLeg | DeliveryLeg | - |
| /delivery/legs/:id/start | POST | DeliveryService.startLeg | DeliveryLeg, ProofEvent | - |
| /delivery/legs/:id/arrive | POST | DeliveryService.arriveLeg | DeliveryLeg, ProofEvent | - |
| /delivery/legs/:id/complete | POST | DeliveryService.completeLeg | DeliveryLeg, ProofEvent | - |
| /delivery/legs/:id/requeue | POST | DeliveryService.requeueLeg | DeliveryLeg | - |
| /delivery/legs/:id/handoff/token | POST | DeliveryService.createHandoffToken | HandoffToken | - |
| /delivery/legs/:id/handoff/confirm | POST | DeliveryService.confirmHandoff | HandoffToken | - |
| /delivery/legs/:id/handoff/receive | POST | DeliveryService.confirmHandoffReceive | HandoffToken | - |
| /delivery/legs/:id/handoff/complete | POST | DeliveryService.completeHubHandoff | DeliveryLeg, ProofEvent, commission | - |
| /delivery/legs/:id/drop-pick/drop | POST | DeliveryService.dropPickDrop | DropPick | - |
| /delivery/legs/:id/drop-pick/pickup | POST | DeliveryService.dropPickPickup | DropPick | - |
| /delivery/proof-events/batch | POST | DeliveryService.createProofEventsBatch | ProofEvent | - |

**Gating**: Leg2 blocked until leg1 handoff/complete with LEG_ARRIVED proof. Commission via ProofEvent eventKey `commission:delivery:${orderId}:${legId}:${eventType}`.

---

## Domain: Deliveries (Per-Request Driver List)

| Endpoint | Method | Service | DB Models | UI |
|----------|--------|---------|-----------|-----|
| /deliveries/:id/drivers | GET | DeliveryService.listDriversForDelivery | User, DeliveryLeg | - |

**Note**: Distinct from /delivery/* — deliveries = driver list per delivery request.

---

## Domain: Infra (Hubs, Routes)

| Endpoint | Method | Service | DB Models | UI |
|----------|--------|---------|-----------|-----|
| /hubs | POST | HubsService.create | Hub | - |
| /hubs/nearby | GET | HubsService.listNearby | Hub | - |
| /hubs/:id/request-removal | POST | HubsService | Hub | - |
| /routes | POST | RoutesService | TaxiRoute, RouteTemplate | - |
| /routes/from/:hubId | GET | RoutesService | TaxiRoute | - |
| /presence/resolve-hub | GET | PresenceService | Hub | - |

**Schema note**: Hub has radiusMeters; API/DTO may use radiusKm. Duplicate detection may need normalizedName (verify schema).

---

## Domain: Admin

All require SuperAdmin. POST = write, requires `reason`, creates AuditLog.

### Read (GET)

| Endpoint | Service | DB Models | UI |
|----------|---------|-----------|-----|
| /admin/orders | AdminService.listOrders | Order | Admin orders list |
| /admin/orders/:id | AdminService.getOrder | Order, Delivery, Legs, ProofEvent | Admin order detail |
| /admin/delivery/stuck | AdminService.listStuck | DeliveryLeg | Admin stuck center |
| /admin/stats | AdminService.getStats | Order, DeliveryLeg, ProofEvent | Admin dashboard |
| /admin/audit | AdminService.listAudit | AuditLog | Admin audit |
| /admin/users | AdminService.listUsers | User | Admin users |
| /admin/users/:id | AdminService.getUserDetail | User | Admin user detail |
| /admin/disputes | (missing) | OrderDispute | Admin disputes list |
| /admin/disputes/:id | (missing) | OrderDispute | Admin dispute detail |
| /admin/slas | AdminService.listSlas | DeliverySlaConfig | - |
| /admin/hubs | AdminService.listHubs | Hub | Admin infra |
| /admin/hubs/duplicates | AdminService.listHubDuplicates | Hub | - |
| /admin/hubs/:id/impact | AdminService.getHubImpact | Hub, TaxiRoute | - |
| /admin/routes | AdminService.listRoutes | TaxiRoute | Admin infra |
| /admin/routes/duplicates | AdminService.listRouteDuplicates | TaxiRoute | - |
| /admin/routes/:id/impact | AdminService.getRouteImpact | TaxiRoute | - |
| /admin/commission/config | AdminService.listCommissionConfig | CommissionConfig | Admin finance |
| /admin/commission/ledger | AdminService.listCommissionLedger | ProofEvent | Admin finance |
| /admin/commission/anomalies | AdminService.listCommissionAnomalies | CommissionRecord | - |
| /admin/jarmenke/events | AdminService.listJarmenkeEvents | JarmenkeEvent | - |
| /admin/access-list | AdminService.listAccessList | AccessListEntry | - |
| /admin/fraud/signals | AdminService.listFraudSignals | FraudSignal | - |
| /admin/rate-limits | AdminService.listRateLimits | RateLimitPolicy | - |
| /admin/alerts | AdminService.listAlerts | AlertConfig | - |
| /admin/playbooks | AdminService.listPlaybooks | IncidentPlaybook | - |
| /admin/infra/health | AdminService.getInfraHealth | Hub, TaxiRoute | - |
| /admin/infra/orphans | AdminService.getInfraOrphans | TaxiRoute | - |
| /admin/exports/stats | AdminService.exportStats | - | - |
| /admin/exports/commission | AdminService.exportCommissionLedger | ProofEvent | - |

### Write (POST, requires reason + AuditLog)

| Endpoint | Service | DB Models | UI |
|----------|---------|-----------|-----|
| /admin/orders/:id/cancel | AdminService.cancelOrder | Order, DeliveryRequest, AuditLog | Order detail |
| /admin/orders/:id/force-status | AdminService.forceOrderStatus | Order, AuditLog | Order detail |
| /admin/orders/:id/dispute | AdminService.openDispute | OrderDispute, AuditLog | Order detail |
| /admin/orders/:id/dispute/resolve | AdminService.resolveDispute | OrderDispute, AuditLog | Dispute detail |
| /admin/orders/:id/refund-flag | AdminService.flagRefund | RefundFlag, AuditLog | Order detail |
| /admin/delivery/legs/:id/reassign | AdminService.reassignLeg | DeliveryLeg, AuditLog | Stuck center |
| /admin/delivery/legs/:id/unlock-mainline | AdminService.unlockMainline | DeliveryLeg, AuditLog | Stuck center |
| /admin/delivery/legs/:id/force-complete | AdminService.forceCompleteLeg | DeliveryLeg, ProofEvent, AuditLog | Order detail |
| /admin/delivery/legs/:id/proof | AdminService.attachLegProof | ProofEvent, AuditLog | Order detail |
| /admin/delivery/legs/:id/adjust-geo | AdminService.adjustLegGeo | DeliveryLeg, AuditLog | Order detail |
| /admin/slas, slas/:id | AdminService.createSla, updateSla | DeliverySlaConfig, AuditLog | - |
| /admin/alerts, alerts/:id | AdminService.createAlert, updateAlert | AlertConfig, AuditLog | - |
| /admin/playbooks, playbooks/:id | AdminService.createPlaybook, updatePlaybook | IncidentPlaybook, AuditLog | - |
| /admin/hubs, hubs/:id | AdminService.createHub, updateHub | Hub, AuditLog | - |
| /admin/hubs/:id/rename | AdminService.renameHub | Hub, AuditLog | - |
| /admin/hubs/:id/deactivate | AdminService.deactivateHub | Hub, AuditLog | - |
| /admin/hubs/:id/merge | AdminService.mergeHub | Hub, TaxiRoute, AuditLog | - |
| /admin/routes, routes/:id | AdminService.createRoute, updateRoute | TaxiRoute, AuditLog | - |
| /admin/routes/:id/rename | AdminService.renameRoute | TaxiRoute, AuditLog | - |
| /admin/routes/:id/toggle | AdminService.toggleRoute | TaxiRoute, AuditLog | - |
| /admin/routes/:id/dedupe | AdminService.dedupeRoute | TaxiRoute, AuditLog | - |
| /admin/commission/config, :id | AdminService | CommissionConfig, AuditLog | - |
| /admin/jarmenke/events | AdminService.createJarmenkeEvent | JarmenkeEvent, AuditLog | - |
| /admin/access-list, :id/remove | AdminService | AccessListEntry, AuditLog | - |
| /admin/rate-limits, rate-limits/:id | AdminService | RateLimitPolicy, AuditLog | - |
| /admin/fraud/signals, :id/resolve | AdminService | FraudSignal, AuditLog | - |

---

## Domain: Other

| Domain | Endpoints | Service | Notes |
|--------|-----------|---------|-------|
| Payments | /payments/health, confirm, webhook | PaymentsService | No in-app transactions per rule |
| Logistics | /logistics/shipments, shipments/:id/* | LogisticsService | ShipmentJob |
| Taxi | /taxi/*, /drivers/* | TaxiService | RideRequest, DriverQueue |
| Profiles | /profiles/me, PUT, avatar | ProfilesService | Profile |
| Users | /users, /users/:id | UsersService | User |
| Users public | /users/:id/public | PublicUsersController | User |
| Regions | /regions, /regions/districts | RegionsService | Region, District |
| Villages | /community-villages, nearest, :id | VillagesService | CommunityVillage |
| Files | /files, /files/upload | FilesService | File |
| Address points | /address-points, search | AddressPointsService | AddressPoint |
| Notifications | /notifications/my, :id/read | NotificationsService | Notification |
| Field | /field/jobs, jobs/:id/* | FieldService | FieldJob |
| Health | /health | HealthController | - |
| Debug | /debug/env, users | DebugController | Dev |

---

## Duplicate / Ambiguous Markers

- **delivery vs deliveries**: NOT duplicate — delivery = leg ops, deliveries = driver list per request.
- **Admin GET disputes**: Missing in controller; frontend expects. Add or document.
- **Hub radiusKm vs radiusMeters**: Schema has radiusMeters; DTOs/API may use radiusKm — verify mapping.
- **Hub normalizedName**: Used in admin/hubs duplicate logic; schema may lack — verify.
