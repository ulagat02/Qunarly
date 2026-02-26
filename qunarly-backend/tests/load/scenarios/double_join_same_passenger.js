/**
 * Double Join: same passenger joins twice. First 201, second 409 (Already booked).
 * Invariant: passenger has exactly 1 active booking.
 */
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { login } from '../lib/auth.js';
import { openTrip, joinTrip, getMeActive } from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;
const VUS = parseInt(__ENV.LOAD_VUS || '5', 10);

const unexpectedRate = new Rate('join_unexpected_rate');
const successCount = new Counter('join_success_count');
const expectedRejectCount = new Counter('join_expected_reject_count');
const unexpectedCount = new Counter('join_unexpected_count');

export const options = {
  vus: VUS,
  iterations: VUS,
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<1'],
    join_unexpected_rate: ['rate<0.01'],
  },
};

export function setup() {
  if (!ROUTE_ID) throw new Error('ROUTE_ID env required');
  const totalSeats = Math.max(VUS * 2, 10);
  const driverToken = login(BASE_URL, 'driver-1@load.test', 'LoadTest123!');
  const { status, data } = openTrip(BASE_URL, driverToken, ROUTE_ID, totalSeats);
  if (status !== 201) throw new Error(`openTrip failed: ${status}`);
  return { tripId: data.id, driverToken };
}

function trackJoin(status, isSecondAttempt) {
  if (status === 201) {
    successCount.add(1);
    unexpectedRate.add(0);
  } else if (status === 409 && isSecondAttempt) {
    expectedRejectCount.add(1);
    unexpectedRate.add(0);
  } else if (status === 409 && !isSecondAttempt) {
    unexpectedCount.add(1);
    unexpectedRate.add(1);
  } else {
    unexpectedCount.add(1);
    unexpectedRate.add(1);
  }
}

export default function (data) {
  const idx = __VU;
  const token = login(BASE_URL, `passenger-double-${idx}@load.test`, 'LoadTest123!');
  const { status: s1 } = joinTrip(BASE_URL, token, data.tripId, 1);
  trackJoin(s1, false);
  check(s1, { 'first join 201': (s) => s === 201 });

  const { status: s2 } = joinTrip(BASE_URL, token, data.tripId, 1);
  trackJoin(s2, true);
  check(s2, { 'second join 409': (s) => s === 409 });

  sleep(0.5);
}

export function teardown(data) {
  // Invariant: each passenger has exactly 1 active booking (check first passenger)
  const token = login(BASE_URL, 'passenger-double-1@load.test', 'LoadTest123!');
  const { status, data: me } = getMeActive(BASE_URL, token);
  if (status !== 200 || !me) {
    throw new Error(`teardown getMeActive failed: ${status}`);
  }
  if (!me.activeBooking) {
    throw new Error('INVARIANT VIOLATION: passenger should have 1 active booking');
  }
}
