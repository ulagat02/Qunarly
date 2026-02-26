"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
const N_DRIVERS = parseInt(process.env.LOAD_DRIVERS || '100', 10);
const M_PASSENGERS = parseInt(process.env.LOAD_PASSENGERS || '1000', 10);
const PASSWORD = 'LoadTest123!';
async function main() {
    const hash = await bcrypt.hash(PASSWORD, 10);
    const activeTrips = await prisma.tripSession.findMany({
        where: {
            status: { in: ['OPEN', 'CLOSING', 'IN_PROGRESS'] },
            driver: { email: { endsWith: '@load.test' } },
        },
        select: { id: true },
    });
    if (activeTrips.length > 0) {
        await prisma.tripBooking.updateMany({
            where: {
                tripId: { in: activeTrips.map((t) => t.id) },
                status: 'ACTIVE',
            },
            data: { status: 'CANCELLED' },
        });
        await prisma.tripSession.updateMany({
            where: { id: { in: activeTrips.map((t) => t.id) } },
            data: { status: 'CANCELLED' },
        });
    }
    let hub1 = await prisma.hub.findFirst({ where: { normalizedName: 'load hub a' } });
    let hub2 = await prisma.hub.findFirst({ where: { normalizedName: 'load hub b' } });
    if (!hub1) {
        hub1 = await prisma.hub.create({
            data: {
                name: 'Load Hub A',
                normalizedName: 'load hub a',
                lat: 43.2,
                lng: 76.9,
                isActive: true,
            },
        });
    }
    if (!hub2) {
        hub2 = await prisma.hub.create({
            data: {
                name: 'Load Hub B',
                normalizedName: 'load hub b',
                lat: 43.3,
                lng: 77.0,
                isActive: true,
            },
        });
    }
    const route = await prisma.taxiRoute.upsert({
        where: {
            fromHubId_toHubId_routeType: {
                fromHubId: hub1.id,
                toHubId: hub2.id,
                routeType: 'VILLAGE_TO_DISTRICT',
            },
        },
        create: {
            fromHubId: hub1.id,
            toHubId: hub2.id,
            routeType: 'VILLAGE_TO_DISTRICT',
            status: 'ACTIVE',
        },
        update: { status: 'ACTIVE' },
    });
    for (let i = 1; i <= N_DRIVERS; i++) {
        const email = `driver-${i}@load.test`;
        await prisma.user.upsert({
            where: { email },
            create: {
                email,
                passwordHash: hash,
                role: 'CARRIER',
            },
            update: { passwordHash: hash },
        });
    }
    for (let i = 1; i <= M_PASSENGERS; i++) {
        const email = `passenger-${i}@load.test`;
        await prisma.user.upsert({
            where: { email },
            create: {
                email,
                passwordHash: hash,
                role: 'FARMER',
            },
            update: { passwordHash: hash },
        });
    }
    for (const suffix of ['pre-1', 'pre-2', 'pre-3']) {
        const email = `passenger-${suffix}@load.test`;
        await prisma.user.upsert({
            where: { email },
            create: { email, passwordHash: hash, role: 'FARMER' },
            update: { passwordHash: hash },
        });
    }
    for (let i = 1; i <= 20; i++) {
        const email = `passenger-race-${100 + i}@load.test`;
        await prisma.user.upsert({
            where: { email },
            create: { email, passwordHash: hash, role: 'FARMER' },
            update: { passwordHash: hash },
        });
    }
    for (let i = 1; i <= 100; i++) {
        const email = `passenger-double-${i}@load.test`;
        await prisma.user.upsert({
            where: { email },
            create: { email, passwordHash: hash, role: 'FARMER' },
            update: { passwordHash: hash },
        });
    }
    await prisma.user.upsert({
        where: { email: 'driver-smoke@load.test' },
        create: { email: 'driver-smoke@load.test', passwordHash: hash, role: 'CARRIER' },
        update: { passwordHash: hash },
    });
    for (let i = 0; i < 10; i++) {
        const email = `passenger-smoke-${i}@load.test`;
        await prisma.user.upsert({
            where: { email },
            create: { email, passwordHash: hash, role: 'FARMER' },
            update: { passwordHash: hash },
        });
    }
    console.log(`LOAD_SEED_OK ROUTE_ID=${route.id}`);
    console.log(`Drivers: 1..${N_DRIVERS}, Passengers: 1..${M_PASSENGERS}, smoke users created.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-load-data.js.map