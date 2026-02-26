# Qunarly — Кешегі және бүгінгі жұмыстың қорытындысы

## Кеше (17.02 және одан бұрын)

### Load test инфрақұрылымы
- **run-k6.js** — Docker (grafana/k6) арқылы k6 іске қосу, scenario маптау
- **package.json** — `load:test:smoke`, `load:test:seat-overflow`, `load:test:closing-race`, `load:test:double-join`, `load:test:life-scenario`
- **seed-load-data.ts** — load.test user-лер мен route жасау, driver-лердің активті рейстерін cancel ету
- **lib/trips.js** — `getTrip`, `getMeActive`, `listOpenTrips`, `openTrip`, `joinTrip`, `leaveTrip`, `closeIntent`, `startTrip`, `safeJson`

### Atomic JOIN (race fix)
- **trips.service.ts** — `joinTrip` Postgres atomic UPDATE қолданады:
  - `bookedSeats + seatCount <= totalSeats`, `status = 'OPEN'` шарттары
  - RETURNING бос болса → 409
  - Барлығы бір Prisma `$transaction` ішінде

### Load test сценарийлері
- **smoke.js** — custom метрикалар
- **seat_overflow.js** — invariant: `bookedSeats ≤ totalSeats`
- **closing_race.js** — driver closeIntent + passenger join параллель
- **double_join_same_passenger.js** — бір пассажир екі рет join, invariant: 1 active booking
- **life_scenario.js** — 5 driver staggered open (0, 5, 12, 15, 20 s), 120 passenger ramping-vus (10s×3), 30s

### Известные проблемы
- life_scenario.js — итерация саны тым үлкен (17.9M) — бос цикл сияқты, http_reqs емес итерация негізгі болып қалған

---

## Бүгін (18.02)

### life_scenario.js түзетулері
- `double_booking_rate.add(0)` — double join болмағанда rate дұрыс есептелуі үшін
- `startTime: '0s'` passengers сценарийден алынды (k6 deprecation)

### life_scenario тестінің нәтижесі
- Барлық threshold өтті: seat_overflow_rate=0, double_booking_rate=0, join_unexpected_rate=0, server_error_rate=0
- Trip summary: 3 IN_PROGRESS, 2 OPEN, violations=0
- `http_req_failed: 24.43%` — әдетте 409/400 (expected)
- Итерация саны үлкен қалды — келесі нұсқада sleep қосылуы қажет етілді

### Өмірдегідей-2 (life_scenario2.js)
Жаңа сценарий шынайы өмірді симуляциялау үшін жасалды:

**Sleep логикасы:**
- Driver loop: `sleep(0.5..2.0)` — итерация саны шынайы болсын
- Passenger loop: `sleep(0.3..1.5)` — http_reqs негізгі метрикаға айналсын

**Passenger flow:**
- GET `/trips/open?routeId=...` join алдында
- List-тен random trip таңдау
- seatCount: 60% =1, 40% =2
- 10% join кейін leave (OPEN/CLOSING → success, IN_PROGRESS → reject expected)

**Driver flow:**
- Staggered openTrip қалды
- bookedSeats≥2 болса 50% closeIntent
- closeIntent кейін sleep(2..6s) → startTrip
- 20% driver OPEN кезінде cancelTrip (1 рет)

**Жаңа метрикалар:**
- `join_reject_closing_rate`, `leave_reject_in_progress_rate` — observe only (threshold жоқ)
- `cancel_with_bookings_count` — driver cancel while bookedSeats>0
- `join_success`, `join_reject_expected`, `leave_success`, `leave_reject_expected`, `cancel_count`

**Thresholds:** seat_overflow_rate==0, double_booking_rate==0, server_error_rate<0.001, join_unexpected_rate<0.01

**Ұзақтығы:** 60 s (30 емес)  
**Stages:** 0→60→120→60 (әр кезең 20 s)

### Басты өзгерістер
- **lib/trips.js** — `cancelTrip()` қосылды (POST /trips/:id/cancel)
- **run-k6.js** — `life-scenario2` маптау
- **package.json** — `load:test:life-scenario2` скрипті

---

## Іске қосу

```bash
cd qunarly-backend
npm run build && npm run start   # Терминал 1
npm run load:test:life-scenario  # Бұрыңғы сценарий
npm run load:test:life-scenario2 # Өмірдегідей-2 (60s)
```
