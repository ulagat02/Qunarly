# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

**Qunarly** is a rural agritech platform MVP for Kazakhstan that connects farmers, buyers, carriers, and service executors. The platform has five core business domains:

1. **Жармеңке (Marketplace)** — Farmers list agricultural products, buyers browse and make offers, negotiate deals
2. **Ауылдық такси (Rural Taxi)** — Intercity/inter-village shared taxi with driver queues, trip sessions, seat bookings
3. **Тасымал (Logistics)** — Shipments with carrier matching, multi-leg relay delivery via hub network, QR-code handoffs
4. **Алаң (Field Services)** — Farm services marketplace (tractor, harvesting, etc.)
5. **Админ панель (Admin)** — Super admin API for order management, dispute resolution, fraud detection, SLA tracking

### Codebase structure

| Directory | What it is | Status |
|-----------|-----------|--------|
| `qunarly-backend/` | NestJS 10 REST API (28+ modules, Prisma 5, PostgreSQL 15) | **Active — core of the platform** |
| `qunarly-mobile/` | React Native / Expo 54 mobile app (5 tabs: Home, Market, Taxi, Logistics, Field) | **Active — primary client** |
| `Icon qunarly/` | Icon design system showcase (Vite + React) — NOT an admin dashboard | Design asset only |
| `qunarly-admin-web/` | Empty placeholder | Not started |
| `qunarly-app/` | Empty placeholder | Not started |
| `docs/` | Domain docs, load test plans, ops manual | Documentation |

### Prerequisites
- **Docker** is required for PostgreSQL 15. Start with `sudo docker compose up -d postgres` from `qunarly-backend/`.
- The backend `.env` is committed with dev-only credentials — no secrets needed for local dev.
- Node.js v22 works fine; the codebase targets ES2021.

### Running services

| Service | Directory | Start command | Port |
|---------|-----------|---------------|------|
| PostgreSQL | `qunarly-backend/` | `sudo docker compose up -d postgres` | 5432 |
| Backend API | `qunarly-backend/` | `npm run start:dev` | 3000 |
| Mobile (native) | `qunarly-mobile/` | `npx expo start --lan` | 8081 |

### Backend workflow
```
cd qunarly-backend
npm ci
npx prisma generate
npx prisma migrate deploy           # applies migrations to dev DB
npm run db:seed                      # seeds admin user (admin@qunarly.kz / Admin123!)
npm run start:dev                    # starts NestJS in watch mode on port 3000
```
Swagger UI is at `http://localhost:3000/api`.

### Mobile app
- The mobile app is **native-only** (iOS/Android). Expo web mode fails because `react-native-image-viewing` has no web exports.
- API client auto-resolves to the Expo dev server's host IP. On web fallback it uses `localhost:3000`.
- Create `qunarly-mobile/.env` with `EXPO_PUBLIC_API_HOST` and `EXPO_PUBLIC_API_PORT` to override.
- Google Maps API key (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`) is optional for dev but needed for map features.
- README is in Kazakh.

### Testing
- **E2E tests** require a separate `qunarly_test` database:
  ```
  sudo docker exec qunarly-postgres psql -U postgres -c "CREATE DATABASE qunarly_test;"
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qunarly_test?schema=public" npx prisma migrate deploy
  npm run test:e2e
  ```
- **Unit tests** (`npm test`) fail due to a missing `jest.config` for ts-jest — pre-existing codebase issue.
- Some e2e tests have pre-existing failures (FK constraint cleanup, status code mismatches). 9/14 suites pass.

### Non-obvious gotchas
- `Icon qunarly/` is just an icon showcase, NOT the admin web dashboard. `qunarly-admin-web/` is empty.
- The admin web directory has a space in its name: `Icon qunarly/`. Always quote the path.
- The admin API endpoints (`/admin/*`) require `SUPER_ADMIN` role, not regular `ADMIN` role.
- Registration requires `homeAddressText`, `homeRegion`, `homeLat`, `homeLng` fields.
- Marketplace offers use `price` field (not `pricePerUnit`), and endpoint is `POST /market/listings/:id/offers`.
- No ESLint config exists in the repo; no lint command is configured.
- E2E tests use port 3001 by default (see `test/jest-e2e-setup.ts`) — won't conflict with dev server on 3000.
- Mobile app lockfile (`package-lock.json`) is out of sync with `package.json` — use `npm install` not `npm ci`.
- Mobile TypeScript has pre-existing errors (`npx tsc --noEmit` fails).
