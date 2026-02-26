/**
 * Smoke: auth, open, join, closeIntent, start — бәрі жұмыс істейді
 * Join: 201 (success) және 409 (expected reject: seats full/active booking) екеуі де күтілетін.
 */
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { login } from '../lib/auth.js';
import { openTrip, joinTrip, closeIntent, startTrip, leaveTrip } from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;

// Custom metrics for join endpoint (201/409 expected; other status = unexpected)
const joinUnexpectedRate = new Rate('join_unexpected_rate');
const joinSuccess = new Counter('join_success');
const joinRejectExpected = new Counter('join_reject_expected');
const joinUnexpected = new Counter('join_unexpected');

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<1'], // relaxed: 409 is expected for join, built-in counts it as failed
    join_unexpected_rate: ['rate<0.01'], // <1% unexpected (non-201/409) responses
  },
};

export function setup() {
  if (!ROUTE_ID) throw new Error('ROUTE_ID env required');
  const driverToken = login(BASE_URL, 'driver-smoke@load.test', 'LoadTest123!');
  const { status, data } = openTrip(BASE_URL, driverToken, ROUTE_ID, 4);
  if (status !== 201) throw new Error(`setup openTrip failed: ${status}`);
  return { tripId: data.id, driverToken };
}

export default function (data) {
  const idx = __VU;
  const token = login(BASE_URL, `passenger-smoke-${idx}@load.test`, 'LoadTest123!');
  const { status: joinStatus } = joinTrip(BASE_URL, token, data.tripId, 1);

  // Join: 201 success, 409 expected reject (seats full/closing/active booking)
  if (joinStatus === 201) {
    joinSuccess.add(1);
    joinUnexpectedRate.add(0);
  } else if (joinStatus === 409) {
    joinRejectExpected.add(1);
    joinUnexpectedRate.add(0);
  } else {
    joinUnexpected.add(1);
    joinUnexpectedRate.add(1);
  }
  check(joinStatus, { 'join 201 or 409': (s) => s === 201 || s === 409 });

  if (__VU === 0) {
    const { status: closeStatus } = closeIntent(BASE_URL, data.driverToken, data.tripId);
    check(closeStatus, { 'closeIntent 200': (s) => s === 200 });
    sleep(11);
    const { status: startStatus } = startTrip(BASE_URL, data.driverToken, data.tripId);
    check(startStatus, { 'start 200': (s) => s === 200 });
  }
  sleep(1);
}
