/**
 * Life scenario: village taxi real-world simulation
 * 5 drivers, staggered trip open (0s, 5s, 12s, 15s, 20s)
 * 120 passengers, ramping load, 10% leave, 5% double-join
 */
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { login } from '../lib/auth.js';
import {
  openTrip,
  joinTrip,
  leaveTrip,
  closeIntent,
  startTrip,
  getTrip,
  listOpenTrips,
} from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;
const DRIVERS = parseInt(__ENV.DRIVERS || '5', 10);
const PASSENGERS = parseInt(__ENV.PASSENGERS || '120', 10);
const TEST_DURATION = __ENV.TEST_DURATION || '30s';

const seatOverflowRate = new Rate('seat_overflow_rate');
const doubleBookingRate = new Rate('double_booking_rate');
const joinUnexpectedRate = new Rate('join_unexpected_rate');
const serverErrorRate = new Rate('server_error_rate');
const tripCompletionCount = new Counter('trip_completion_count');
const tripCancelCount = new Counter('trip_cancel_count');

export const options = {
  scenarios: {
    drivers: {
      executor: 'constant-vus',
      vus: DRIVERS,
      duration: TEST_DURATION,
      exec: 'driverBehavior',
    },
    passengers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },
        { duration: '10s', target: 120 },
        { duration: '10s', target: 50 },
      ],
      gracefulRampDown: '5s',
      exec: 'passengerBehavior',
    },
  },
  thresholds: {
    seat_overflow_rate: ['rate==0'],
    double_booking_rate: ['rate==0'],
    join_unexpected_rate: ['rate<0.01'],
    server_error_rate: ['rate<0.001'],
  },
};

export function setup() {
  if (!ROUTE_ID) throw new Error('ROUTE_ID env required');
  const trips = [];
  const stagger = [0, 5, 12, 15, 20];
  for (let i = 1; i <= DRIVERS; i++) {
    if (i > 1) sleep(stagger[i - 1] - stagger[i - 2]);
    const token = login(BASE_URL, `driver-${i}@load.test`, 'LoadTest123!');
    const { status, data } = openTrip(BASE_URL, token, ROUTE_ID, 4);
    if (status !== 201) throw new Error(`setup openTrip driver-${i} failed: ${status}`);
    trips.push({ tripId: data.id, driverToken: token, driverIdx: i });
  }
  const anyToken = login(BASE_URL, 'passenger-1@load.test', 'LoadTest123!');
  return { trips, routeId: ROUTE_ID, anyToken };
}

export function driverBehavior(data) {
  const idx = __VU;
  const trip = data.trips[idx - 1];
  if (!trip) return;
  const closeThreshold = 2 + Math.floor(Math.random() * 3);
  while (true) {
    const { status, data: t } = getTrip(BASE_URL, trip.driverToken, trip.tripId);
    if (status !== 200 || !t) break;
    if (t.status !== 'OPEN') break;
    if (t.bookedSeats >= closeThreshold) {
      const closeRes = closeIntent(BASE_URL, trip.driverToken, trip.tripId);
      if (closeRes.status === 200 || closeRes.status === 201) {
        sleep(3 + Math.random() * 7);
        const startRes = startTrip(BASE_URL, trip.driverToken, trip.tripId);
        if (startRes.status === 200 || startRes.status === 201) {
          tripCompletionCount.add(1);
        }
      }
      break;
    }
    sleep(0.5 + Math.random() * 1);
  }
}

export function passengerBehavior(data) {
  sleep(Math.random() * 5);
  const idx = (__VU - 1) % PASSENGERS + 1;
  const token = login(BASE_URL, `passenger-${idx}@load.test`, 'LoadTest123!');
  const { status: listStatus, data: openTrips } = listOpenTrips(
    BASE_URL,
    data.anyToken,
    data.routeId,
  );
  if (listStatus !== 200 || !openTrips || openTrips.length === 0) return;
  const trip = openTrips[Math.floor(Math.random() * openTrips.length)];
  const tripId = trip.id;
  const seatCount = Math.random() < 0.5 ? 1 : 2;

  const { status, data: resData } = joinTrip(BASE_URL, token, tripId, seatCount);

  if (status === 201) {
    joinUnexpectedRate.add(0);
    serverErrorRate.add(0);
    seatOverflowRate.add(0);
    if (Math.random() < 0.1) {
      leaveTrip(BASE_URL, token, tripId);
    }
    if (Math.random() < 0.05) {
      const { status: s2 } = joinTrip(BASE_URL, token, tripId, 1);
      if (s2 === 201) {
        doubleBookingRate.add(1);
      } else {
        doubleBookingRate.add(0);
      }
    } else {
      doubleBookingRate.add(0);
    }
  } else if (status === 409 || status === 400) {
    joinUnexpectedRate.add(0);
    serverErrorRate.add(0);
    seatOverflowRate.add(0);
    doubleBookingRate.add(0);
  } else {
    joinUnexpectedRate.add(1);
    serverErrorRate.add(status >= 500 ? 1 : 0);
    if (status === 400) {
      console.log(`[life] unexpected 400: ${JSON.stringify(resData)}`);
    }
  }
  sleep(0.2 + Math.random() * 0.5);
}

export function teardown(data) {
  let violations = 0;
  const summary = [];
  for (const trip of data.trips) {
    const { status, data: t } = getTrip(BASE_URL, trip.driverToken, trip.tripId);
    if (status !== 200 || !t) continue;
    const overflow = t.bookedSeats > t.totalSeats;
    if (overflow) {
      violations++;
      seatOverflowRate.add(1);
    } else {
      seatOverflowRate.add(0);
    }
    summary.push(
      `trip ${t.id.slice(0, 8)}: bookedSeats=${t.bookedSeats} totalSeats=${t.totalSeats} status=${t.status}`,
    );
  }
  console.log('\n[life] Trip summary:');
  summary.forEach((s) => console.log('  ' + s));
  console.log(`[life] Violations: ${violations}`);
}
