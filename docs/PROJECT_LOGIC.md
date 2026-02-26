# Qunarly — Жобаның толық логикасы

> Ауылдық агротехнологиялық платформа (Қазақстан MVP)

---

## 0. Qunarly деген не?

**Qunarly** – фермерлерге, ауыл тұрғындарына және шағын кәсіп иелеріне арналған біріккен цифрлық платформа.

### Миссия
Ауылды «онлайн экономикаға» кіргізу — делдалсыз, тікелей, цифрлық.

### Негізгі бағыттар

| # | Модуль | Мақсат | Статус |
|---|--------|--------|--------|
| 1 | **Ауыл такси** | Ауыл→аудан→қала рейстер, кезек логикасы, орын бақылауы | ✅ Іске асырылды |
| 2 | **Жармеңке (Маркетплейс)** | Ауыл өнімін тікелей сату (картоп, ет, сүт, астық), ~3% комиссия | ✅ Іске асырылды |
| 3 | **Тасымал (Логистика)** | Эстафеталық жеткізу хаб арқылы, QR тапсыру | ✅ Іске асырылды |
| 4 | **Техника жалға беру** | Трактор, комбайн, жүк көлігі, жұмысшы | ⚠️ Негізі бар, кеңейту қажет |
| 5 | **Қойма қызметтері** | Сақтау, жер қызметтері | ❌ Жоқ |
| 6 | **Сертификаттау** | Сертификат алу, экспортқа шығу көмегі | ❌ Жоқ |
| 7 | **Рейтинг/пікір** | Сатушы/орындаушы бағалау жүйесі | ⚠️ Тек көрсету (жазу жоқ) |
| 8 | **Админ панелі** | Тапсырыс, дау, алаяқтық, SLA басқару | ✅ API іске асырылды |

### Тарихи ұқсастық
Алтын Орда дәуіріндегі **ям** (эстафеталық пошта) жүйесі — ауыл→хаб→қала, жүргізушілер бір-біріне тапсырады. Qunarly бұл логиканы цифрлық форматта жасайды.

---

## 0.1 Визия мен іске асырылу GAP анализі

### Техника жалға беру (Field Jobs) — кеңейту қажет

| Не қажет | Қазіргі жағдай |
|----------|---------------|
| Техника категориялары (трактор, комбайн, жүк көлігі) | ❌ ServiceType тек name + baseRate |
| Жұмысшы жалдау (workerCount) | ❌ Тек техника, адам жоқ |
| Баға модельдері (сағатына/күніне/гектарына) | ⚠️ Тек гектарына (`baseRate * areaHa`) |
| Техника қолжетімділігі/күнтізбе | ❌ Жоқ |
| Орындаушы рейтингі | ❌ Жоқ |
| ExecutorProfile endpoints | ❌ Модель бар, endpoint жоқ |

**Қажетті schema өзгерістер:**
```
ServiceType:
  + equipmentCategory: TRACTOR | COMBINE | TRUCK | WORKER | OTHER
  + pricingUnit: PER_HECTARE | PER_HOUR | PER_DAY

FieldJob:
  + workerCount: Int?
  + preferredStartDate: DateTime?
  + durationHours: Float?
  + pricingModel: PER_HECTARE | PER_HOUR | PER_DAY

Жаңа модельдер:
  EquipmentItem (executorId, category, name, specs)
  FieldJobReview (jobId, reviewerId, rating, comment)
```

### Қойма қызметтері — толығымен жоқ

| Не қажет | Қазіргі жағдай |
|----------|---------------|
| Қойма тізімі (орын, көлем, баға) | ❌ Жоқ (тек WarehouseIcon бар) |
| Қойма жалдау/бронь | ❌ Жоқ |
| Қойма іздеу (регион, көлем) | ❌ Жоқ |
| Жер қызметтері | ❌ Жоқ |

### Сертификаттау / Экспорт — толығымен жоқ

| Не қажет | Қазіргі жағдай |
|----------|---------------|
| Сертификат өтінімі | ❌ Жоқ |
| Құжат жүктеу | ❌ Жоқ |
| Экспорт нұсқаулық | ❌ Жоқ |
| Сертификат мекемелер базасы | ❌ Жоқ |

### Рейтинг/пікір жүйесі — толықтыру қажет

| Не қажет | Қазіргі жағдай |
|----------|---------------|
| Пікір жазу (review) | ❌ Жоқ |
| Рейтинг есептеу | ⚠️ `User.ratingStats` Json бар, бірақ толтырылмайды |
| Пікір көрсету | ✅ UI-де көрсетіледі |

---

## 1. Жалпы архитектура

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Mobile App     │────▶│  Backend API     │────▶│  PostgreSQL 15   │
│  (Expo/RN)      │     │  (NestJS)        │     │                  │
│  :8081          │     │  :3000           │     │  :5432           │
└─────────────────┘     └──────────────────┘     └──────────────────┘
                              │
                        ┌─────┴─────┐
                        │ Swagger   │
                        │ /api      │
                        └───────────┘
```

**Рөлдер**: `FARMER`, `BUYER`, `CARRIER`, `EXECUTOR`, `ADMIN`, `SUPER_ADMIN`, `WHOLESALE_BUYER`

---

## 2. Аутентификация (Auth)

### Тіркелу (Register)
```
POST /auth/register
├── email/phone + password + role
├── homeAddressText, homeRegion, homeLat, homeLng (міндетті)
├── CARRIER → maxWeightKg, vehicleType, maxVolumeM3 (қосымша)
├── bcrypt hash → User жазбасы
├── CARRIER болса → CarrierProfile жазбасы
└── JWT accessToken (15 мин) + refreshToken (30 күн) қайтарады
```

### Кіру (Login)
```
POST /auth/login
├── email НЕМЕСЕ phone + password
├── bcrypt.compare()
└── JWT accessToken + refreshToken қайтарады
```

### Жаңарту (Refresh)
```
POST /auth/refresh
├── refreshToken → tokenHash тексеріледі
├── Ескі токен жойылады
└── Жаңа accessToken + refreshToken
```

---

## 3. Жармеңке (Marketplace / Market)

### 3.1 Жарнама (Listing)

**Фермер жарнама жасайды:**
```
POST /market/listings
├── title, description, category, unit, price, quantity, currency
├── addressText (міндетті)
├── Тексеру: тек FARMER рөлі
└── status = PUBLISHED
```

**Суреттер жүктеу:**
```
POST /market/listings/:id/images
├── Multer арқылы файл жүктеу
├── File + ListingImage жазбалары
└── sortOrder бойынша сұрыпталады
```

**Баға деңгейлері (Price Tiers):**
```
ProductPriceTier: minQty, maxQty, unitPrice, currency
├── Сатып алушы тапсырыс бергенде тиісті деңгей таңдалады
└── Мысалы: 1-100кг = 200₸, 100-500кг = 180₸, 500+кг = 150₸
```

### 3.2 Ұсыныс (Offer)

**Сатып алушы ұсыныс жасайды:**
```
POST /market/listings/:id/offers
├── quantity, price, message
├── Тексеру: тек BUYER рөлі
└── Offer.status = SENT
```

**Фермер ұсынысқа жауап:**
```
POST /market/offers/:id/accept   → Deal жасалады (автоматты logistics мәліметтерімен)
POST /market/offers/:id/counter  → Offer.status = COUNTERED, жаңа unitPrice
POST /market/offers/:id/reject   → Offer.status = REJECTED
```

### 3.3 Мәміле (Deal)

**Accept кезінде автоматты логистика:**
```
Deal жасалады →
├── agreedQuantity, agreedUnitPrice
├── cargoWeightKg = buyer.homeLat? → seller/buyer мекен-жай
├── pickupLat/Lng = seller address
├── dropoffLat/Lng = buyer address
├── pickupRegion, dropoffRegion
└── status = NEGOTIATING
```

**Мәмілені растау:**
```
POST /market/deals/:id/confirm → status = CONFIRMED
POST /market/deals/:id/open-logistics → ShipmentJob жасалады
```

---

## 4. Тапсырыстар (Orders)

### Тапсырыс логикасы:
```
POST /orders
├── listingId, quantity, destinationText, destLat, destLng
├── Баға тиері бойынша unitPrice таңдалады
├── idempotencyKey → қайталануды болдырмайды
├── DeliveryRequest жасалады
│   ├── originText = listing.addressText
│   └── destinationText = buyer мекен-жайы
│
├── Хаб анықтау: PresenceService.resolveHub(sellerLat, sellerLng)
│   ├── Хабтан тыс → 2 leg (village→hub=250₸, hub→city=1250₸)
│   └── Хаб ішінде → 1 leg (hub→city=1250₸)
│
├── DeliveryLeg жазбалары жасалады
│   ├── sortOrder = 1, 2
│   ├── status = OFFERING
│   └── price = 250 немесе 1250
│
├── CommissionRecord жасалады
│   ├── productRateApplied, deliveryRateApplied
│   ├── JarmenkeEvent override тексеріледі
│   └── source = DEFAULT немесе EVENT_OVERRIDE
│
└── Order.status = PLACED
```

---

## 5. Жеткізу (Delivery / Relay System)

### 5.1 Leg өмірлік циклі:
```
OFFERING → ACCEPTED → STARTED → ARRIVED → COMPLETED
    │          │          │          │          │
    │          │          │          │          └── completedAt, commission есептеледі
    │          │          │          └── arrivedAt, arrivedLat/Lng
    │          │          └── startedAt
    │          └── acceptedAt, driverId орнатылады
    └── Жүргізушілерге ұсынылады
```

### 5.2 Handoff (эстафета):
```
2-leg жеткізу жағдайында:

Leg1 жүргізуші:
  1. POST /delivery/legs/:id/handoff/token → Қабылдаушы QR жасайды (2 мин)
  2. POST /delivery/legs/:id/handoff/confirm → Жіберуші QR сканерлейді
  3. GPS тексерісі (<=100м)
  4. POST /delivery/legs/:id/handoff/receive → Қабылдаушы растайды
  5. POST /delivery/legs/:id/handoff/complete → Хабта тапсыру аяқталады

Leg2 GATING:
  ├── Leg2 ACCEPTED болса да, Leg1 handoff аяқталмайынша БАСТАЙ АЛМАЙДЫ
  ├── Leg1 LEG_ARRIVED proof қажет
  └── Admin unlock-mainline арқылы ашуға болады
```

### 5.3 Drop-Pick (тастап кету):
```
POST /delivery/legs/:id/drop-pick/drop
├── droppedBy, dropLat/Lng, dropPhoto1/2
├── pickupTokenHash, pickupExpiresAt
└── status = DROPPED

POST /delivery/legs/:id/drop-pick/pickup
├── pickupBy, pickupLat/Lng, pickupPhoto1/2
├── Token тексерісі + GPS тексерісі
└── status = PICKED_UP
```

### 5.4 Commission (комиссия):
```
Leg аяқталғанда ProofEvent жасалады:
├── eventKey = "commission:delivery:{orderId}:{legId}:{eventType}"
├── metaJson = { commissionAmount, rate, ... }
├── Idempotent: бірдей eventKey қайталанбайды
└── Бұл жалғыз ақша есебі (in-app transactions жоқ)
```

---

## 6. Логистика (Logistics / Shipments)

### ShipmentJob өмірлік циклі:
```
CREATED → OFFERED → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
    │                    │                        │
    │                    └── acceptedBy (CARRIER)  └── cancel мүмкін
    └── Баға есептелу:
        ├── baseFee = 500
        ├── perKm = 15
        ├── perKg = 2
        ├── perM3 = 50
        ├── surcharge (refrig, livestock, closed body)
        └── estimatedPrice
```

### Carrier ұсыну:
```
GET /logistics/shipments/:id/recommendations
├── Region сәйкестігі
├── CargoType сәйкестігі
├── Capacity жеткіліктілігі
└── Рейтинг бойынша сұрыпталады
```

---

## 7. Такси (Rural Taxi)

### 7.1 Бағыт (Route):
```
TaxiRoute: fromHubId → toHubId, routeType
├── VILLAGE_TO_DISTRICT
├── DISTRICT_TO_CITY
└── VILLAGE_TO_CITY
```

### 7.2 Жолаушы ағымы:
```
1. GET /taxi/routes → Бағыттарды көру
2. POST /taxi/requests → Сұраныс жасау (routeId, seats, cargoType, departureType)
   └── status = PENDING
3. Жүйе → DriverOffer жасайды (TTL = 45 сек)
4. Жүргізуші қабылдайды → status = MATCHED
5. DRIVER_EN_ROUTE → IN_RIDE → COMPLETED
```

### 7.3 Жүргізуші ағымы:
```
1. POST /drivers/queue/join → Кезекке тұру (routeId, capacity)
   └── DriverQueue.status = IN_QUEUE
2. POST /drivers/queue/ping → Белсенділікті растау
3. GET /drivers/offers/pending → Ұсыныстарды көру
4. POST /drivers/offers/:id/accept → Қабылдау
5. POST /drivers/queue/passengers/:id/confirm → Жолаушыны растау
6. POST /drivers/queue/on-the-way → Жолға шығу
```

### 7.4 TripSession (рейс):
```
POST /trips/open → OPEN (totalSeats орнатылады)
POST /trips/:id/join → bookedSeats артады
POST /trips/:id/leave → bookedSeats азаяды
POST /trips/:id/closeIntent → CLOSING (3 мин)
POST /trips/:id/start → IN_PROGRESS
POST /trips/:id/complete → COMPLETED
POST /trips/:id/cancel → CANCELLED
```

### 7.5 Seat логикасы:
```
DriverQueue:
├── capacity = жалпы орын (мыс: 4)
├── availableSeats = capacity - confirmedCount
└── CONFIRMED → seats азаяды, REMOVED/NO_SHOW → seats артады

TripSession:
├── totalSeats = жүргізуші бастапқыда орнатады
├── bookedSeats = join кезінде atomic increment
└── bookedSeats == totalSeats → толды
```

---

## 8. Дала жұмыстары (Field Jobs)

### FieldJob өмірлік циклі:
```
CREATED → BROADCASTED → ACCEPTED → IN_PROGRESS → COMPLETED
    │                       │                        │
    │                       └── EXECUTOR қабылдайды   └── cancel мүмкін
    └── Баға есептелу:
        ├── priceEstimate = baseRate * areaHa + travelFee
        └── travelFee = GPS қашықтық бойынша
```

---

## 9. Админ панелі (Admin API)

### 9.1 Іске асырылған (GET):
- ✅ `/admin/orders` — тапсырыстар тізімі (cursor pagination)
- ✅ `/admin/orders/:id` — толық тапсырыс мәліметі
- ✅ `/admin/delivery/stuck` — тұрып қалған жеткізулер (4 себеп: WAITING_PROOF, LEG2_BLOCKED, NO_DRIVER, TIMEOUT)
- ✅ `/admin/disputes` — дауларды тізімі
- ✅ `/admin/disputes/:id` — дау мәліметі
- ✅ `/admin/stats` — KPI (ordersToday, orders7d, activeDeliveries, stuckDeliveries, commission)
- ✅ `/admin/audit` — аудит журналы
- ✅ `/admin/users` — пайдаланушылар тізімі
- ✅ `/admin/users/:id` — пайдаланушы мәліметі
- ✅ `/admin/alerts` — ескерту конфигтары
- ✅ `/admin/playbooks` — инцидент нұсқаулықтары
- ✅ `/admin/slas` — SLA конфигтары
- ✅ `/admin/hubs` — хабтар тізімі
- ✅ `/admin/routes` — маршруттар тізімі

### 9.2 Іске асырылған (POST):
- ✅ `/admin/orders/:id/cancel` — тапсырысты жою + AuditLog
- ✅ `/admin/delivery/legs/:id/reassign` — жүргізушіні ауыстыру + AuditLog
- ✅ `/admin/delivery/legs/:id/unlock-mainline` — leg2 блокін ашу + AuditLog

### 9.3 Іске асырылған POST (бұрын stub еді):
- ✅ `POST /admin/orders/:id/force-status` — enum тексерісі + статус өзгерту + AuditLog
- ✅ `POST /admin/orders/:id/dispute` — OrderDispute жазбасын жасау + AuditLog
- ✅ `POST /admin/orders/:id/dispute/resolve` — дауды шешу (resolution, closedAt) + AuditLog
- ✅ `POST /admin/orders/:id/refund-flag` — RefundFlag жазбасын жасау + AuditLog
- ✅ `POST /admin/delivery/legs/:id/force-complete` — leg COMPLETED + ProofEvent + AuditLog
- ✅ `POST /admin/delivery/legs/:id/proof` — ProofEvent upsert + AuditLog
- ✅ `POST /admin/delivery/legs/:id/adjust-geo` — arrivedLat/Lng жаңарту + AuditLog
- ✅ `POST /admin/slas`, `POST /admin/slas/:id` — DeliverySlaConfig CRUD + AuditLog
- ✅ `POST /admin/alerts`, `POST /admin/alerts/:id` — AlertConfig CRUD + AuditLog
- ✅ `POST /admin/playbooks`, `POST /admin/playbooks/:id` — IncidentPlaybook CRUD + AuditLog
- ✅ `POST /admin/hubs` — Hub жасау (normalizedName) + AuditLog
- ✅ `POST /admin/routes` — TaxiRoute жасау (ACTIVE) + AuditLog
- ✅ `POST /admin/commission/config` — CommissionConfig жасау + AuditLog
- ✅ `POST /admin/jarmenke/events` — JarmenkeEvent жасау + AuditLog
- ✅ `POST /admin/access-list` / `POST /admin/access-list/:id/remove` — AccessListEntry CRUD + AuditLog
- ✅ `POST /admin/rate-limits` — RateLimitPolicy жасау + AuditLog
- ✅ `POST /admin/fraud/signals/:id/resolve` — FraudSignal.status → RESOLVED/DISMISSED + AuditLog
- ✅ `GET /admin/exports/stats` — нақты CSV (7 күндік chart деректері)
- ✅ `GET /admin/exports/commission` — нақты CSV (CommissionRecord деректері)

### 9.4 Іске асырылған GET (бұрын бос массив еді):
- ✅ `GET /admin/commission/config` — CommissionConfig кестесінен
- ✅ `GET /admin/commission/ledger` — CommissionRecord + Order мәліметтері
- ✅ `GET /admin/commission/anomalies` — rate > 15% болған жазбалар
- ✅ `GET /admin/jarmenke/events` — JarmenkeEvent кестесінен
- ✅ `GET /admin/access-list` — AccessListEntry кестесінен
- ✅ `GET /admin/fraud/signals` — FraudSignal кестесінен (status filter)
- ✅ `GET /admin/rate-limits` — RateLimitPolicy кестесінен
- ✅ `GET /admin/infra/health` — нақты hub/route статистикалары + дупликат анықтау
- ✅ `GET /admin/infra/orphans` — inactive хабтарға байланысқан маршруттар

---

## 10. Географиялық инфрақұрылым

### Hub (хаб):
```
Hub: name, lat, lng, radiusKm (=0.8), isActive
├── Жеткізу relay-дің қиылысу нүктесі
├── Жаңа хаб: 5км ішінде дупликат тексерісі
├── normalizedName → дупликат анықтау
└── Маршруттар хабтарға байланысады
```

### Route (маршрут):
```
TaxiRoute: fromHubId → toHubId, routeType
├── @@unique([fromHubId, toHubId, routeType])
├── status: INACTIVE → ACTIVE → PAUSED → ARCHIVED
└── Такси кезегі мен сұраныстар маршрутқа байланысады
```

### Region → District → Settlement иерархиясы:
```
Region (облыс) → District (аудан) → Settlement (елді мекен)
CommunityVillage — қолданушылар қосқан ауыл нүктесі (lat/lng)
```

---

## 11. Хабарламалар (Notifications)

```
Notification: userId, type, title, body, dataJson, isRead
├── Push: Expo Server SDK арқылы
├── expoPushToken → User моделінде сақталады
├── Типтер: TAXI_OFFER, ORDER_STATUS, DELIVERY_STATUS, ...
└── In-app: GET /notifications/my
```

---

## 12. Файлдар (Files)

```
POST /files/upload
├── Multer → uploads/ директориясы
├── File моделі: ownerId, type, url, metaJson
├── entityType: PROFILE_AVATAR, LISTING_IMAGE, OTHER
└── ListingImage, Profile.avatarFile байланыстары
```

---

## 13. Мобильді қосымша экрандары

| Tab | Экрандар | API интеграциясы |
|-----|----------|-----------------|
| Home | Dashboard, notifications, quick actions | profiles/me, notifications/my |
| Market | Listings, details, create, offers, deals | market/* |
| Taxi | Passenger request, driver queue, trips | taxi/*, drivers/*, trips/* |
| Logistics | Shipments, handoff QR, delivery legs | logistics/*, delivery/* |
| Field | Job list, create, lifecycle | field/* |

**Жетіспейтін экрандар:**
- ❌ Chat/хабарлама жүйесі
- ❌ Рейтинг/пікір жазу
- ❌ Төлем интеграциясы
- ❌ Тест посттар (Home) — API жоқ
- ❌ Байланыс батырмасы — «Жақында» деп stub

---

## 14. Жетіспейтін тұстар (Summary)

### Backend (іске асырылды):
- ✅ 20+ Admin stub → нақты логикамен
- ✅ Admin GET → нақты деректермен
- ✅ CSV экспорт → нақты деректер
- ✅ jest.config.ts → unit тесттер жұмыс істейді

### Backend (жетіспейтін):
1. **Техника жалға беру кеңейтуі** — equipmentCategory, pricingUnit, workerCount
2. **Қойма модулі** — Warehouse model + CRUD + іздеу
3. **Сертификаттау модулі** — Certificate + ExportAssistance
4. **Рейтинг/пікір** — Review model + CRUD + агрегация
5. **Payments** — Kaspi QR интеграциясы
6. **Chat/хабарлама** — real-time messaging

### Frontend (жетіспейтін):
1. **Admin Web Dashboard** — `qunarly-admin-web/` бос
2. **Chat экрандары** — мобильді қосымшада жоқ
3. **Рейтинг/пікір UI** — жазу функциясы жоқ
4. **Төлем UI** — Kaspi QR экрандары жоқ
5. **Қойма экрандары** — мобильді қосымшада жоқ
6. **Сертификаттау экрандары** — мобильді қосымшада жоқ

### Инфрақұрылым:
1. **ESLint** — конфиг жоқ
2. **CI/CD** — тек k6 load test workflow

---

## 15. Даму жоспары (Roadmap)

### Phase 1: MVP толықтыру (қазір)
- [x] Ауыл такси ✅
- [x] Жармеңке маркетплейс ✅
- [x] Эстафеталық жеткізу ✅
- [x] Дала жұмыстары (негізі) ✅
- [x] Админ API ✅
- [ ] Рейтинг/пікір жүйесі
- [ ] Техника жалға беру кеңейтуі (категориялар, баға модельдері)

### Phase 2: Кеңейту
- [ ] Қойма қызметтері модулі
- [ ] Admin Web Dashboard (React)
- [ ] Chat/хабарлама жүйесі (WebSocket)
- [ ] Kaspi QR төлем интеграциясы
- [ ] ExecutorProfile endpoints

### Phase 3: Масштабтау
- [ ] Сертификаттау / экспорт модулі
- [ ] Жер қызметтері
- [ ] AI-негізделген баға ұсыну
- [ ] Мультитілді (қазақша/орысша)
- [ ] PWA admin dashboard
