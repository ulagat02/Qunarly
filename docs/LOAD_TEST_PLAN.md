# Qunarly такси TripSession — Load/Stress тест жоспары

## 0. Нақты мақсат пен SLO (Service Level Objectives)

### Инварианттар (әрдайым сақталуы керек)

| Инвариант | Мақсат | Өлшем |
|-----------|--------|-------|
| Seat overflow | 0 | bookedSeats <= totalSeats |
| Double booking | 0 | Passenger активті booking <= 1 |
| Driver active trips | 1 max | Driver активті TripSession <= 1 |
| JOIN CLOSING/IN_PROGRESS кезінде | 0 success | Status check |

### Latency SLO

| Метрика | 1 VU | 10 VU | 100 VU | 1000 VU | 10k VU |
|---------|------|-------|--------|---------|--------|
| p95 (ms) | < 200 | < 300 | < 500 | < 1000 | < 2000 |
| p99 (ms) | < 500 | < 700 | < 1000 | < 2000 | < 5000 |
| Error rate | 0% | < 0.1% | < 0.5% | < 1% | < 2% |

### Join reject rate (күтілетін)

- Seat overflow: 100% reject (409/400) — дұрыс
- Active booking: 100% reject (409) — дұрыс
- CLOSING кезінде: 100% reject (409) — дұрыс

### Ресурс шектері (staging)

- CPU: 80% аспау (sustained)
- RAM: 2GB app, 1GB Postgres — аспау
- DB connections: pool limit-дан аспау
- Postgres slow query: 1s аспау

---

## 1. Құралдар салыстырмасы

| Қасиет | k6 | Artillery | autocannon |
|--------|-----|-----------|------------|
| Тіл | JavaScript (ES6) | YAML + JS | Node.js |
| Бірінші рет қолдану | Жақсы | Жақсы | Орташа |
| Транзакция / сценарий | Күшті | Орташа | Аз |
| CI/GitHub Actions | Иә (Docker, binary) | Иә | Иә |
| JSON/HTML report | Иә (cloud + local) | Иә | Жоқ (baseline) |
| HTTP/2, WebSocket | Иә | Иә | Жоқ |
| NestJS/Prisma үшін | Иә | Иә | Иә |

**Ұсыныс: k6** — сценарийлер күрделі (auth → open → join → close → start), JS синтаксисі түсінікті, CI интеграциясы жақсы, threshold/assertion күшті.

*Alternative:* Artillery — егер YAML конфигурациясын артықшылық беретін болса.

---

## 2. Тест ортасы (staging)

### Ескерту

- **Prod-қа тест жібермеу.** Тест тек staging ортада қана іске қосылады.
- Staging URL: `STAGING_URL` env (мысалы `http://localhost:3000` немесе `https://staging.qunarly.kz`).

### Docker Compose (staging)

```yaml
# docker-compose.staging.yml (үсыныс)
version: "3.9"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: qunarly
    ports: ["5432:5432"]
  app:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/qunarly
      NODE_ENV: development
      JWT_SECRET: staging_jwt_secret
    depends_on: [postgres]
    ports: ["3000:3000"]
```

*Assumption:* Redis қолданылмайды; егер бар болса, қосылады.

### DB reset стратегиясы

| Стратегия | Қолдану кезі | Мағынасы |
|-----------|--------------|----------|
| Truncate | Әр full suite алдында | TripSession, TripBooking, seed users сақталып, trips/bookings тазаланады |
| Transaction rollback | Егер мүмкін болса | Әр тест алдында tx басталып, аяғында rollback |
| Snapshot | Nightly | pg_dump + restore (баяу, бірақ толық таза орта) |

**Ұсыныс:** Әр load suite алдында `prisma.tripBooking.deleteMany()` + `prisma.tripSession.deleteMany()` — trips/booking-тар тазаланады; users, routes, hubs seed-пен толтырылады.

---

## 3. Тест деректерін генерациялау

### Seed script (`tests/load/seed-load-data.ts` немесе prisma seed кеңейтімі)

- **N driver:** 10–1000 (email: `driver-{i}@load.test`, password: `LoadTest123!`, role: CARRIER)
- **M passenger:** 50–10000 (email: `passenger-{i}@load.test`, password: `LoadTest123!`, role: FARMER)
- **K route:** 1–10 (бір hub-қа байланысты, ACTIVE)

### Auth токендері

| Режим | Сипаттама | Қолдану |
|-------|-----------|---------|
| **Login** | `POST /auth/login` { email, password } | Әр VU өз token-ін алады |
| **dev-login** | `POST /auth/dev-login` (NODE_ENV !== production) | Бір admin token — smoke тест |
| **Pre-seeded tokens** | Seed кезінде token жасалып, JSON файлға жазылады | Тест басында оқылады (тез) |

*Assumption:* `/auth/dev-login` staging-та қосылған; prod-та өшірілген.

### Жергілікті іске қосу (Docker)

k6 npm пакеті бинарлық қамтамасыз етпейді. Docker арқылы іске қосыңыз:

```bash
cd qunarly-backend
npm run build && npm run start   # Терминал 1
npm run load:test:smoke          # Терминал 2
npm run load:test:seat-overflow
npm run load:test:closing-race
npm run load:test                # smoke (default)
```

Талаптар: Docker іске қосылған, Postgres және backend іске қосылған.

**50+ VU үшін:** Prisma connection pool автоматты 80-ге орнатылады (PrismaService). Егер DATABASE_URL-де `connection_limit` болмаса, `connection_limit=80` қосылады. Басқа мән үшін `DATABASE_CONNECTION_LIMIT=100` орнатыңыз.

### Rate limiting

- Staging-та rate limit әдетте әлсіз немесе өшірілген (load тест үшін).
- **Егер rate limit бар болса:** env `RATE_LIMIT_DISABLED=true` немесе admin panel арқылы жоғары лимит орнату.
- *Alternative:* әр VU бір IP сияқты эмуляцияланбайды; rate limit "per user" болса, әсері аз.

### Телефон/хабарлама

- Тест кезінде нақты SMS/пуш жіберілмеуі керек.
- Seed user-лер үшін `phone: null` немесе mock phone.
- Notifications service mock болуы немесе staging-та disabled.

---

## 4. Міндетті тест сценарийлері

### A) Seat Overflow Test

**Мақсат:** bookedSeats + seatCount <= totalSeats транзакциялық сақталатынын тексеру.

**Preconditions:**
- 1 route, 1 driver, trip OPEN, totalSeats=4, bookedSeats=0
- 50 passenger token дайын

**Steps:**
1. 50 passenger параллель `POST /trips/:tripId/join` { seatCount: 1 }
2. Жауаптарды жинау: 201 vs 400/409

**Expected:**
- Дәл 4 success (201)
- 46 reject (409 Bad Request / Not enough seats)
- bookedSeats === 4

**Asserts:**
- `check(res, 'status') === 201` count === 4
- `check(res, 'status') in [400, 409]` count === 46
- GET /trips/:id → bookedSeats === 4, totalSeats === 4

**Metrics:** p95 latency, error rate, throughput

---

### B) Closing Race Condition Test

**Мақсат:** CLOSING кезінде join reject болатынын тексеру.

**Preconditions:**
- 1 trip OPEN, totalSeats=4, bookedSeats=3
- 1 driver token, 10 passenger token

**Steps:**
1. Бір мезгілде: driver `POST /trips/:id/closeIntent` және 10 passenger `POST /trips/:id/join` { seatCount: 1 }
2. Жауаптарды жинау

**Expected:**
- closeIntent: 200
- Join: 0 немесе 1 success (дәл closing-нан бұрын келген болса), қалғаны 409 "Рейс жабылып жатыр"
- bookedSeats <= 4

**Asserts:**
- bookedSeats never > 4
- JOIN success count <= 1

---

### C) Double Join Same Passenger

**Мақсат:** Бір passenger бірнеше рет join басса, тек біріншісі success.

**Preconditions:**
- 1 trip OPEN, totalSeats=10
- 1 passenger token

**Steps:**
1. Passenger 5 рет қатар `POST /trips/:id/join` { seatCount: 1 }

**Expected:**
- 1 success (201)
- 4 reject (409 "Active booking exists" немесе "Already booked")

**Asserts:**
- success count === 1
- GET /me/active → activeBooking 1 ғана

---

### D) Many Drivers / Many Trips

**Мақсат:** Көп driver және passenger бір route-та load кезінде seat лимит сақталады.

**Preconditions:**
- 1 route
- 100 driver, 1000 passenger token

**Steps:**
1. 100 driver параллель `POST /trips/open` { routeId, totalSeats: 4 }
2. 1000 passenger random 100 trip-қа `POST /trips/:id/join` { seatCount: 1 }
3. әр trip-та max 4 passenger success болуы керек

**Expected:**
- Max 400 success join (100 trip × 4 seat)
- 600 reject
- Әр trip: bookedSeats <= 4

**Asserts:**
- Sum(bookedSeats) across trips <= 400
- p95 latency < 1000ms (100 VU)

---

### E) Start Without Closing / Invalid Transitions

**Мақсат:** Policy сәйкес reject.

**E1) OPEN кезінде start:**
- Driver `POST /trips/:id/start` (trip OPEN)
- Expected: 400 "Trip must be CLOSING to start"

**E2) closingUntil өтпей start:**
- Driver closeIntent, 2 сек күту, start
- Expected: 200 (CLOSING кезінде start рұқсат етілген)

**E3) IN_PROGRESS кезінде join:**
- Trip IN_PROGRESS, passenger join
- Expected: 400 "Trip is not accepting bookings"

---

### F) Leave / Cancel Seat Consistency

**F1) Leave:**
- Passenger join (seatCount=2) → bookedSeats=2
- Passenger leave → bookedSeats=0
- GET /trips/:id: bookedSeats === 0

**F2) Parallel leave + start (IN_PROGRESS):**
- Trip OPEN, 2 passenger join
- Driver closeIntent
- Passenger 1 leave (рұқсат етілген — CLOSING)
- Driver start
- Passenger 2 leave: 400 (IN_PROGRESS кезінде leave болмайды)

---

### G) Expire Cleanup

- OPEN trip, expiresAt = now - 1min
- Cron 1 мин ішінде EXPIRED етеді
- GET /trips/open?routeId=: EXPIRED рейс көрсетілмеуі керек

**Assert:** listOpenTrips EXPIRED қайтармайды.

---

### H) Idempotency

*Assumption:* Текущий API-да join үшін client_request_id жоқ. activeBooking check арқылы duplicate блокталады.

- Егер client_request_id қосылса: 2 рет бірдей id жіберсе — 1 success, 2-ші idempotent success (200 + бірдей booking).

---

## 5. Әр сценарийге инварианттар

| Сценарий | bookedSeats <= totalSeats | Passenger active <= 1 | Driver active <= 1 | CLOSING/IN_PROGRESS join = 0 | Data integrity |
|----------|---------------------------|------------------------|--------------------|------------------------------|----------------|
| A | ✓ | ✓ | ✓ | N/A | ✓ |
| B | ✓ | ✓ | ✓ | ✓ | ✓ |
| C | ✓ | ✓ | ✓ | N/A | ✓ |
| D | ✓ | ✓ | ✓ | N/A | ✓ |
| E | ✓ | ✓ | ✓ | ✓ | ✓ |
| F | ✓ | ✓ | ✓ | ✓ | ✓ |
| G | ✓ | ✓ | ✓ | N/A | ✓ |
| H | ✓ | ✓ | ✓ | N/A | ✓ |

---

## 6. Тест скрипт құрылымы

```
qunarly-backend/
  tests/
    load/
      lib/
        auth.js      # login, token cache
        trips.js     # openTrip, joinTrip, leaveTrip, closeIntent, startTrip, completeTrip
      scenarios/
        a-seat-overflow.js
        b-closing-race.js
        c-double-join.js
        d-many-trips.js
        e-invalid-transitions.js
        f-leave-consistency.js
        g-expire.js
      config.js      # BASE_URL, TOKEN_MODE, etc.
      smoke.js       # Light smoke (1 VU, 30s)
      run.sh         # Wrapper: seed + k6 run
```

### ENV vars

```bash
BASE_URL=http://localhost:3000
TOKEN_MODE=login          # login | dev-login | file
USERS_COUNT=50
RAMP_UP=10s
DURATION=60s
ROUTE_ID=                 # optional, seed-тен алынады
```

### k6 helper үлгілері

```javascript
// lib/auth.js
export function login(baseUrl, email, password) {
  const res = http.post(`${baseUrl}/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
  return res.json('accessToken');
}

// lib/trips.js
export function openTrip(baseUrl, token, routeId, totalSeats = 4) {
  const res = http.post(`${baseUrl}/trips/open`, JSON.stringify({ routeId, totalSeats }), {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  });
  return { status: res.status, data: res.json() };
}

export function joinTrip(baseUrl, token, tripId, seatCount = 1) {
  const res = http.post(`${baseUrl}/trips/${tripId}/join`, JSON.stringify({ seatCount }), {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  });
  return { status: res.status };
}
```

### Сценарий параметрлері (VUs, duration, ramp)

| Сценарий | VUs | Duration | Ramp |
|----------|-----|----------|------|
| A | 50 | 30s | 5s |
| B | 11 | 20s | 2s |
| C | 1 | 10s | 0 |
| D | 200 | 120s | 30s |
| E | 1 | 10s | 0 |
| F | 3 | 15s | 2s |
| G | 1 | 90s | 0 (cron 1min) |
| Smoke | 5 | 30s | 5s |

---

## 7. Метрика/бақылау

- **k6:** `--summary-trend-stats="avg,med,p(95),p(99)"` + `--threshold` (p99<2000, http_req_failed<0.01)
- **Server logs:** `correlationId` немесе `requestId` (егер бар болса)
- **Postgres:** `log_min_duration_statement=500` (500ms+ медлен query логталады)
- **Prisma:** `DEBUG=prisma:query` тест кезінде (optional)
- **Grafana/Prometheus:** Optional; k6 JSON export → custom дашборд

---

## 8. Репортинг форматы

### Әр тесттен кейін

```
Scenario: A-seat-overflow
Result: PASS | FAIL
Metrics:
  - http_reqs: 50
  - http_req_duration_p95: 120ms
  - http_req_failed: 0.02 (1 failed = expected 409)
  - Invariants: bookedSeats<=4 ✓
Bugs: []
```

### Қателер картасы

| Endpoint | Status | Count | Сценарий |
|----------|--------|-------|----------|
| POST /trips/:id/join | 409 | 46 | A |
| POST /trips/:id/join | 400 | 10 | B |

---

## 9. CI интеграция (GitHub Actions)

```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  pull_request:
    paths: ['qunarly-backend/**', 'tests/load/**']
  schedule:
    - cron: '0 2 * * *'  # Nightly 02:00

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start services
        run: docker-compose -f docker-compose.staging.yml up -d
      - name: Seed data
        run: npm run load:seed
      - name: Run k6 smoke
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/scenarios/smoke.js
          cloud: false
        env:
          BASE_URL: http://localhost:3000
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: k6-smoke-report
          path: k6-results.json

  full:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4
      - name: Start services
        run: docker-compose -f docker-compose.staging.yml up -d
      - name: Seed data
        run: npm run load:seed
      - name: Run k6 full suite
        uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/run-all.js
        env:
          BASE_URL: http://localhost:3000
      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: k6-full-report
          path: k6-report.html
```

---

## 10. Қауіпсіздік және шектеу

- **Staging only:** Тест тек staging ортада. Prod URL env-та болмауы керек.
- **Токендер:** .env немесе GitHub Secrets; репоға commit болмауы керек.
- **Rate limit:** Staging-та load тест үшін әлсіз/өшірілген.
- **SMS/Push:** Mock немесе disabled; нақты телефон/хабарлама жіберілмесін.
- **Data isolation:** Staging DB prod-тан бөлек; seed арнайы `@load.test` домені.

---

## Алдымен қандай 3 тестті бірден іске қосылуы керек

### Приоритет 1: Seat Overflow (A)

**Себебі:** Критикалық инвариант — орын overflow болмауы керек. Деректер тұтастығын тексеру.

**Параметрлер:** VUs=50, duration=30s, ramp=5s

---

### Приоритет 2: Closing Race (B)

**Себебі:** Уақыт race condition — driver "кетем" деген сәтте join-дер дұрыс reject болуы керек.

**Параметрлер:** VUs=11, duration=20s, ramp=2s

---

### Приоритет 3: Smoke (Smoke)

**Себебі:** CI-да жылдам санау — auth, open, join, closeIntent, start бәрі жұмыс істейді ма?

**Параметрлер:** VUs=5, duration=30s, ramp=5s

---

## Қосымша: k6 негізгі шаблон скрипт қаңқасы

```javascript
// tests/load/scenarios/a-seat-overflow.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { login } from '../lib/auth.js';
import { openTrip, joinTrip } from '../lib/trips.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 50,
  duration: '30s',
  rampUp: '5s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export function setup() {
  const driverToken = login(BASE_URL, 'driver-1@load.test', 'LoadTest123!');
  const { data: trip } = openTrip(BASE_URL, driverToken, __ENV.ROUTE_ID, 4);
  return { tripId: trip.id, routeId: __ENV.ROUTE_ID };
}

export default function (data) {
  const passengerIdx = __VU;
  const token = login(BASE_URL, `passenger-${passengerIdx}@load.test`, 'LoadTest123!');
  const res = joinTrip(BASE_URL, token, data.tripId, 1);
  check(res, { 'join status 201 or 409': (r) => r.status === 201 || r.status === 409 });
  sleep(0.1);
}
```

---

## Assumption-дар мен альтернативалар

| Assumption | Альтернатива |
|------------|--------------|
| /auth/dev-login staging-та қосылған | Seed кезінде token жасалып файлға жазу; k6 setup-та оқу |
| Rate limit staging-та өшірілген | RATE_LIMIT_DISABLED env немесе жоғары лимит |
| Postgres local/staging Docker | Бөлек staging server; DATABASE_URL ортадан |
| k6 binary CI-да | Docker image: `grafana/k6` |
| Idempotency join-де жоқ | C) сценарийда activeBooking check жеткілікті |
