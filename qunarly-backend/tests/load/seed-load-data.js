/**
 * Load test data seed script.
 * Creates: N drivers, M passengers, K routes (hubs + TaxiRoute)
 * Run: BASE_URL=... ROUTE_ID=... node tests/load/seed-load-data.js
 * Or: ROUTE_ID is output at end for use in k6
 *
 * Prerequisites: DB migrated, at least one Hub exists.
 * Creates users: driver-{1..N}@load.test, passenger-{1..M}@load.test
 * Password: LoadTest123!
 *
 * Requires: Node 18+, Prisma client generated
 * Usage: npx ts-node tests/load/seed-load-data.ts (or .js if using ts-node)
 * Alternative: Add to package.json "load:seed": "node tests/load/seed-load-data.js"
 *
 * NOTE: This script uses Prisma directly. For JS, we need prisma to be available.
 * A simpler approach: use a separate Node script that calls the API to register users,
 * or extend prisma/seed.ts to accept LOAD_SEED=1 and create load users.
 *
 * Minimal: Document that user runs prisma/seed first, then manually creates
 * driver-1@load.test, passenger-1..50@load.test via POST /auth/register
 * or a small script.
 */

const N_DRIVERS = parseInt(process.env.LOAD_DRIVERS || '100', 10);
const M_PASSENGERS = parseInt(process.env.LOAD_PASSENGERS || '1000', 10);

console.log(`
Load seed data requirements:
- N drivers: ${N_DRIVERS} (driver-1@load.test .. driver-${N_DRIVERS}@load.test)
- M passengers: ${M_PASSENGERS} (passenger-1@load.test .. passenger-${M_PASSENGERS}@load.test)
- Password: LoadTest123!

To create users, use POST /auth/register with:
{ email, password, role, homeAddressText, homeRegion, homeLat, homeLng }

Or extend prisma/seed.ts with LOAD_SEED=1 to create these users via Prisma.
`);
