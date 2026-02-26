/**
 * Seat Overflow: 1 trip totalSeats=4, N passengers parallel join
 * Expected: 4 success (201), rest reject (409). Invariant: bookedSeats <= totalSeats, bookedSeats == totalSeats
 */
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { login } from '../lib/auth.js';
import { openTrip, joinTrip, getTrip } from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;
const VUS = parseInt(__ENV.LOAD_VUS || '50', 10);

const unexpectedRate = new Rate('join_unexpected_rate');
const successCount = new Counter('join_success_count');
const expectedRejectCount = new Counter('join_expected_reject_count');
const unexpectedCount = new Counter('join_unexpected_count'); // tags: { status }
const serverErrorRate = new Rate('join_server_error_rate');

export const options = {
  scenarios: {
    default: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<1'],
    join_unexpected_rate: ['rate<0.01'],
    join_server_error_rate: ['rate<0.001'],
  },
};

export function setup() {
  if (!ROUTE_ID) throw new Error('ROUTE_ID env required');
  const driverToken = login(BASE_URL, 'driver-1@load.test', 'LoadTest123!');
  const { status, data } = openTrip(BASE_URL, driverToken, ROUTE_ID, 4);
  if (status !== 201) throw new Error(`openTrip failed: ${status}`);
  return { tripId: data.id, driverToken };
}

export default function (data) {
  const idx = __VU;
  const token = login(BASE_URL, `passenger-${idx}@load.test`, 'LoadTest123!');
  const { status, data: resData } = joinTrip(BASE_URL, token, data.tripId, 1);

  if (status === 201) {
    successCount.add(1);
    unexpectedRate.add(0);
    serverErrorRate.add(0);
  } else if (status === 409) {
    expectedRejectCount.add(1);
    unexpectedRate.add(0);
    serverErrorRate.add(0);
  } else {
    unexpectedCount.add(1, { status: String(status) });
    unexpectedRate.add(1);
    serverErrorRate.add(status >= 500 ? 1 : 0);
    console.log(`[seat_overflow] unexpected status=${status} VU=${__VU} iteration=${__ITER}`);
    if (status === 400) {
      console.log(`[seat_overflow] 400 body: ${JSON.stringify(resData)}`);
    }
    if (status === 401 || status === 403) {
      console.log(`[seat_overflow] auth issue status=${status} VU=${__VU}`);
    }
  }
  check(status, { 'join 201 or 409': (s) => s === 201 || s === 409 });
  sleep(0.1);
}

export function teardown(data) {
  // Invariant: bookedSeats <= totalSeats, bookedSeats == totalSeats
  const { status, data: trip } = getTrip(BASE_URL, data.driverToken, data.tripId);
  if (status !== 200 || !trip) {
    throw new Error(`teardown getTrip failed: ${status}`);
  }
  if (trip.bookedSeats > trip.totalSeats) {
    throw new Error(`INVARIANT VIOLATION: bookedSeats(${trip.bookedSeats}) > totalSeats(${trip.totalSeats})`);
  }
  if (trip.bookedSeats !== trip.totalSeats) {
    throw new Error(`Seat overflow invariant: expected bookedSeats==totalSeats, got ${trip.bookedSeats}/${trip.totalSeats}`);
  }
}
