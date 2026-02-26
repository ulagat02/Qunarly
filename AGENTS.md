# AGENTS.md

## Cursor Cloud specific instructions

### Product overview
Qunarly is a rural agritech platform (Kazakhstan MVP) with three main codebases:
- **`qunarly-backend/`** — NestJS 10 REST API (TypeScript, Prisma 5, PostgreSQL 15)
- **`Icon qunarly/`** — Admin web dashboard (Vite + React 18 + Tailwind CSS 4 + Radix UI)
- **`qunarly-mobile/`** — React Native / Expo 54 mobile app (not runnable headless in cloud)

### Prerequisites
- **Docker** is required for PostgreSQL 15. Start with `sudo docker compose up -d postgres` from `qunarly-backend/`.
- The backend `.env` is committed with dev-only credentials — no secrets needed for local dev.
- Node.js v22 works fine; the codebase targets ES2021.

### Running services

| Service | Directory | Start command | Port |
|---------|-----------|---------------|------|
| PostgreSQL | `qunarly-backend/` | `sudo docker compose up -d postgres` | 5432 |
| Backend API | `qunarly-backend/` | `npm run start:dev` | 3000 |
| Admin Web | `Icon qunarly/` | `npx vite --host 0.0.0.0` | 5173 |

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

### Testing
- **E2E tests** require a separate `qunarly_test` database:
  ```
  sudo docker exec qunarly-postgres psql -U postgres -c "CREATE DATABASE qunarly_test;"
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qunarly_test?schema=public" npx prisma migrate deploy
  npm run test:e2e
  ```
- **Unit tests** (`npm test`) currently fail due to a missing `jest.config` for ts-jest — this is a pre-existing codebase issue.
- Some e2e tests have pre-existing failures (FK constraint cleanup issues, status code mismatches). 9/14 suites pass as-is.

### Non-obvious gotchas
- The admin web directory has a space in the name: `Icon qunarly/`. Always quote the path.
- The `qunarly-admin-web/` and `qunarly-app/` directories are empty placeholders.
- E2E tests use port 3001 by default (see `test/jest-e2e-setup.ts`) — they won't conflict with a running dev server on 3000.
- Registration requires `homeAddressText`, `homeRegion`, `homeLat`, `homeLng` fields (not just email/password).
- No ESLint config exists in the repo; no lint command is configured.
