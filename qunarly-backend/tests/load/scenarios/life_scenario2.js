/**
 * Өмірдегідей-2: village taxi real-world simulation
 * 5 drivers, staggered trip open, 120 passengers ramping
 * Mandatory sleeps for realistic iteration count; http_reqs as main metric
 */
import { sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { login } from '../lib/auth.js';
import {
  openTrip,
  joinTrip,
  leaveTrip,
  closeIntent,
  startTrip,
  cancelTrip,
  getTrip,
  listOpenTrips,
} from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const ROUTE_ID = __ENV.ROUTE_ID;
const DRIVERS = parseInt(__ENV.DRIVERS || '5', 10);
const PASSENGERS = parseInt(__ENV.PASSENGERS || '120', 10);

const seatOverflowRate = new Rate('seat_overflow_rate');
const doubleBookingRate = new Rate('double_booking_rate');
const joinUnexpectedRate = new Rate('join_unexpected_rate');
const serverErrorRate = new Rate('server_error_rate');
const joinRejectClosingRate = new Rate('join_reject_closing_rate');
const leaveRejectInProgressRate = new Rate('leave_reject_in_progress_rate');

const joinSuccessCount = new Counter('join_success');
const joinRejectExpectedCount = new Counter('join_reject_expected');
const leaveSuccessCount = new Counter('leave_success');
const leaveRejectExpectedCount = new Counter('leave_reject_expected');
const cancelWithBookingsCount = new Counter('cancel_with_bookings_count');
const cancelCount = new Counter('cancel_count');
const tripCompletionCount = new Counter('trip_completion_count');

export const options = {
  scenarios: {
    drivers: {
      executor: 'constant-vus',
      vus: DRIVERS,
      duration: '60s',
      exec: 'driverBehavior',
    },
    passengers: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 60 },
        { duration: '20s', target: 120 },
        { duration: '20s', target: 60 },
      ],
      gracefulRampDown: '5s',
      exec: 'passengerBehavior',
    },
  },
  thresholds: {
    seat_overflow_rate: ['rate==0'],
    double_booking_rate: ['rate==0'],
    server_error_rate: ['rate<0.001'],
    join_unexpected_rate: ['rate<0.01'],
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
  const tryCancelOnce = idx <= Math.ceil(DRIVERS * 0.2); // 20% try cancel

  while (true) {
    const { status, data: t } = getTrip(BASE_URL, trip.driverToken, trip.tripId);
    if (status !== 200 || !t) break;
    if (t.status !== 'OPEN') break;

    // 20% try cancel once while OPEN (driverIdx 1)
    if (tryCancelOnce && !trip._cancelTried) {
      trip._cancelTried = true;
      const bookedBefore = t.bookedSeats;
      const cancelRes = cancelTrip(BASE_URL, trip.driverToken, trip.tripId);
      cancelCount.add(1);
      if (cancelRes.status === 200 || cancelRes.status === 201) {
        if (bookedBefore > 0) cancelWithBookingsCount.add(1);
      }
      break;
    }

    // random policy: bookedSeats>=2 → 50% chance closeIntent
    if (t.bookedSeats >= 2 && Math.random() < 0.5) {
      const closeRes = closeIntent(BASE_URL, trip.driverToken, trip.tripId);
      if (closeRes.status === 200 || closeRes.status === 201) {
        sleep(2 + Math.random() * 4); // 2..6s
        const startRes = startTrip(BASE_URL, trip.driverToken, trip.tripId);
        if (startRes.status === 200 || startRes.status === 201) {
          tripCompletionCount.add(1);
        }
      }
      break;
    }

    sleep(0.5 + Math.random() * 1.5); // 0.5..2.0
  }
}

export function passengerBehavior(data) {
  sleep(0.3 + Math.random() * 1.2); // 0.3..1.5

  const idx = (__VU - 1) % PASSENGERS + 1;
  const token = login(BASE_URL, `passenger-${idx}@load.test`, 'LoadTest123!');

  const { status: listStatus, data: openTrips } = listOpenTrips(
    BASE_URL,
    data.anyToken,
    data.routeId,
  );
  if (listStatus !== 200 || !openTrips || openTrips.length === 0) {
    sleep(0.3 + Math.random() * 1.2);
    return;
  }

  const trip = openTrips[Math.floor(Math.random() * openTrips.length)];
  const tripId = trip.id;
  const seatCount = Math.random() < 0.6 ? 1 : 2; // 60% =1, 40% =2

  const { status, data: resData } = joinTrip(BASE_URL, token, tripId, seatCount);

  if (status === 201) {
    joinSuccessCount.add(1);
    joinUnexpectedRate.add(0);
    serverErrorRate.add(0);
    seatOverflowRate.add(0);
    doubleBookingRate.add(0);
    joinRejectClosingRate.add(0);

    // 5% double-join attempt
    if (Math.random() < 0.05) {
      const { status: s2 } = joinTrip(BASE_URL, token, tripId, 1);
      if (s2 === 201) doubleBookingRate.add(1);
      else doubleBookingRate.add(0);
    } else {
      doubleBookingRate.add(0);
    }

    // 10% leave after join
    if (Math.random() < 0.1) {
      const leaveRes = leaveTrip(BASE_URL, token, tripId);
      if (leaveRes.status >= 200 && leaveRes.status < 300) {
        leaveSuccessCount.add(1);
        leaveRejectInProgressRate.add(0);
      } else {
        leaveRejectExpectedCount.add(1);
        leaveRejectInProgressRate.add(1); // expected when IN_PROGRESS
      }
    }
  } else if (status === 409 || status === 400) {
    joinRejectExpectedCount.add(1);
    joinRejectClosingRate.add(1); // expected (closing/full)
    joinUnexpectedRate.add(0);
    serverErrorRate.add(0);
    seatOverflowRate.add(0);
    doubleBookingRate.add(0); // not double-booking
  } else {
    joinUnexpectedRate.add(1);
    serverErrorRate.add(status >= 500 ? 1 : 0);
  }

  sleep(0.3 + Math.random() * 1.2); // 0.3..1.5
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
      `trip ${t.id.slice(0, 8)}: status=${t.status} bookedSeats=${t.bookedSeats}/${t.totalSeats}`,
    );
  }

  console.log('\n[Өмірдегідей-2] Trip summary:');
  summary.forEach((s) => console.log('  ' + s));
  console.log(`[Өмірдегідей-2] Violations: ${violations}`);
  console.log(
    `[Өмірдегідей-2] Counters: join_success, join_reject_expected, leave_success, leave_reject_expected, cancel_count - see CUSTOM metrics`,
  );
}
