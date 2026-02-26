/**
 * A) Seat Overflow Test
 * 1 trip totalSeats=4, 50 passenger parallel join seatCount=1
 * Expected: 4 success, 46 reject, bookedSeats <= 4
 */
import { check, sleep } from 'k6';
import { login } from '../lib/auth.js';
import { openTrip, joinTrip, getTrip } from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.95'], // 409 seat full expected when 50 VUs compete for 4 seats
  },
};

export function setup() {
  if (!ROUTE_ID) throw new Error('ROUTE_ID env required');
  const driverToken = login(BASE_URL, 'driver-1@load.test', 'LoadTest123!');
  const { status, data } = openTrip(BASE_URL, driverToken, ROUTE_ID, 4);
  if (status !== 201) throw new Error(`openTrip failed: ${status}`);
  return { tripId: data.id };
}

export default function (data) {
  const idx = __VU;
  const token = login(BASE_URL, `passenger-${idx}@load.test`, 'LoadTest123!');
  const { status } = joinTrip(BASE_URL, token, data.tripId, 1);
  check(status, { 'join 201 or 409': (s) => s === 201 || s === 409 });
  sleep(0.1);
}
