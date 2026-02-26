/**
 * Closing Race: trip OPEN bookedSeats=3, driver closeIntent + 10 passengers join in parallel
 * Expected: closeIntent ok, join 0-1 success, rest 400/409. Invariant: bookedSeats <= totalSeats
 */
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { login } from '../lib/auth.js';
import { openTrip, joinTrip, closeIntent, getTrip } from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;
const VUS = parseInt(__ENV.LOAD_VUS || '10', 10);

const unexpectedRate = new Rate('join_unexpected_rate');
const successCount = new Counter('join_success_count');
const expectedRejectCount = new Counter('join_expected_reject_count');
const unexpectedCount = new Counter('join_unexpected_count');

export const options = {
  scenarios: {
    driver: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      exec: 'driverClose',
    },
    passengers: {
      executor: 'constant-vus',
      vus: VUS,
      duration: '15s',
      exec: 'passengerJoin',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<1'],
    join_unexpected_rate: ['rate<0.01'],
  },
};

export function setup() {
  if (!ROUTE_ID) throw new Error('ROUTE_ID env required');
  const driverToken = login(BASE_URL, 'driver-1@load.test', 'LoadTest123!');
  const { status, data } = openTrip(BASE_URL, driverToken, ROUTE_ID, 4);
  if (status !== 201) throw new Error(`openTrip failed: ${status}`);
  for (let i = 1; i <= 3; i++) {
    const pt = login(BASE_URL, `passenger-pre-${i}@load.test`, 'LoadTest123!');
    joinTrip(BASE_URL, pt, data.id, 1);
  }
  return { tripId: data.id, driverToken };
}

export function driverClose(data) {
  const { status } = closeIntent(BASE_URL, data.driverToken, data.tripId);
  check(status, { 'closeIntent 200/201': (s) => s === 200 || s === 201 });
}

export function passengerJoin(data) {
  const idx = __VU + 100;
  const token = login(BASE_URL, `passenger-race-${idx}@load.test`, 'LoadTest123!');
  const { status } = joinTrip(BASE_URL, token, data.tripId, 1);

  if (status === 201) {
    successCount.add(1);
    unexpectedRate.add(0);
  } else if (status === 400 || status === 409) {
    expectedRejectCount.add(1);
    unexpectedRate.add(0);
  } else {
    unexpectedCount.add(1);
    unexpectedRate.add(1);
  }
  check(status, { 'join 201/400/409': (s) => s === 201 || s === 400 || s === 409 });
  sleep(0.5);
}

export function teardown(data) {
  // Invariant: bookedSeats <= totalSeats
  const { status, data: trip } = getTrip(BASE_URL, data.driverToken, data.tripId);
  if (status !== 200 || !trip) {
    throw new Error(`teardown getTrip failed: ${status}`);
  }
  if (trip.bookedSeats > trip.totalSeats) {
    throw new Error(`INVARIANT VIOLATION: bookedSeats(${trip.bookedSeats}) > totalSeats(${trip.totalSeats})`);
  }
}
