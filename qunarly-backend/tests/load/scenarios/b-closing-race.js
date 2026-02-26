/**
 * B) Closing Race Condition Test
 * trip OPEN bookedSeats=3, driver closeIntent + 10 passenger join in parallel
 * Expected: closing ok, join 0-1 success, rest 409
 */
import { check, sleep } from 'k6';
import { login } from '../lib/auth.js';
import { openTrip, joinTrip, closeIntent } from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;

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
      vus: 10,
      duration: '15s',
      exec: 'passengerJoin',
    },
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
  check(status, { 'join 201/400/409': (s) => s === 201 || s === 400 || s === 409 });
  sleep(0.5);
}
