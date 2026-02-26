# Qunarly — Аудит есебі

---

## 🔴 КРИТИКАЛЫҚ (бірінші түзету)

### 1. JWT құпия кілт — production-да қауіпті
**Файл:** `auth.service.ts`, `jwt.strategy.ts`
```
JWT_SECRET болмаса → 'dev_secret' қолданылады
```
**Қауіп:** Продакшнда токен жасалуы мүмкін.
**Шешім:** Env variable болмаса → қосымша іске қосылмауы керек (startup fail).

---

### 2. Offer қабылдауда race condition
**Файл:** `market.service.ts:376`
```
acceptOffer: offer статусын тексеріп, Deal жасайды — бірақ atomic емес
```
**Қауіп:** 2 адам бірдей ұсынысты бір уақытта қабылдаса → 2 Deal жасалады.
**Шешім:** `$transaction` + `offer.status = SENT` WHERE шарты.

---

### 3. Орын бронь — race condition
**Файл:** `trips.service.ts:89-173`
```
bookedSeats артуы мен booking жасалуы бөлек
```
**Қауіп:** 2 жолаушы бірдей орынды алуы мүмкін (overbooking).
**Шешім:** Atomic UPDATE + CHECK шарты.

---

### 4. Маркетплейс тізімде pagination жоқ
**Файл:** `market.service.ts:106`, `logistics.service.ts:84`
```
findMany() — limit жоқ
```
**Қауіп:** 10,000 жарнама болса → серверді бұзады.
**Шешім:** Барлық list endpoint-ке `take: limit` қосу.

---

## 🟠 ЖОҒАРЫ МАҢЫЗДЫ

### 5. Offer қабылдауда авторизация жоқ
**Файл:** `market.service.ts:376`
```
Offer қабылдаушы = listing иесі ме? — тексерілмейді
```
**Шешім:** `offer.listing.sellerId === userId` тексерісін қосу.

---

### 6. Idempotency жоқ — offer accept
**Файл:** `market.service.ts:376`
```
Бірдей offer 2 рет accept болса → 2 Deal жасалады
```
**Шешім:** `offer.status !== 'SENT'` болса → reject.

---

### 7. ProofEvent батырма — роль тексерісі жоқ
**Файл:** `delivery.controller.ts:121`
```
createProofEventsBatch — кез келген JWT бар пайдаланушы жасай алады
```
**Шешім:** `@Roles(UserRole.CARRIER)` guard қосу.

---

### 8. Handoff статус қайшылық
**Файл:** `delivery.service.ts:532`
```
confirmHandoffReceive — leg статусын STARTED-ке қояды, тіпті STARTED болса да
```
**Шешім:** Статусты тексеріп, тек қажет болса өзгерту.

---

### 9. Транзакция rollback жоқ
**Файл:** `market.service.ts:376-463`
```
Deal жасалды → ShipmentJob сәтсіз болды → Deal жойылмайды
```
**Шешім:** `prisma.$transaction()` ішіне алу.

---

## 🟡 ОРТАША МАҢЫЗДЫ

### 10. Құпия сөз тексерісі әлсіз
**Файл:** `auth/dto/register.dto.ts:15`
```
Тек @MinLength(6) — бас әріп, сан, символ шарты жоқ
```

### 11. Query параметрлер валидацияланбайды
**Файлдар:** `market.controller.ts`, `orders.controller.ts`, `taxi.controller.ts`
```
search, regionId, listingId — DTO-сыз қабылданады
```

### 12. Database индекстер жоқ
```
deliveryLeg.status, rideRequest.status, tripSession.status — index жоқ
```
**Әсер:** Деректер көбейгенде сұраныстар баяулайды.

### 13. Қате формат стандарт емес
```
Кейде: throw BadRequestException
Кейде: return { ok: false, error: '...' }
```

---

## 📱 МОБИЛЬДІ ҚОСЫМША

### 🔴 Критикалық

### 14. Тест деректер production-да қалған
**Файл:** `app/(tabs)/index.tsx`
```
Line 382: "Тест пост: ..."
Line 489: "Тест пост жазыңыз..." placeholder
Line 501: "Тест жазба" label
```
**Шешім:** Тест посттар бөлімін алып тастау немесе нақты API-ға қосу.

---

### 🟠 Жоғары

### 15. API қателерді пайдаланушыға көрсетпейді
**Файлдар:**
- `map.tsx:243,267,286,305` — API қатесі тек console.log
- `market/index.tsx:434` — `catch { setListings([]) }` — хабарлама жоқ
- `taxi/passenger/wait.tsx:39,84` — try/catch жоқ

### 16. Loading индикаторлар жоқ
**Файлдар:**
- `market/details/[id].tsx` — деректер жүктелгенде бос экран
- `u/[userId].tsx` — профиль жүктелгенде бос
- `notifications/archive.tsx` — хабарламалар жүктелгенде бос

### 17. Бос тізім хабарламасы жоқ
**Файлдар:**
- `market/my-listings.tsx` — жарнама болмаса бос
- `market/inbox.tsx` — ұсыныс болмаса бос
- `market/deals.tsx` — мәміле болмаса бос

---

### 🟡 Орташа

### 18. Hardcoded түстер (theme-ді қолданбайды)
**Файл:** `market/create.tsx:265,284,312,327,333`
```
'#D0D0D0', '#2E7D32', '#E8F5E9', '#333', '#FFFFFF'
```

### 19. Accessibility label-дар жоқ
```
Барлық TouchableOpacity — accessibilityLabel жоқ
Барлық Image — alt text жоқ
```

---

## ✅ ҰСЫНЫСТАР (приоритет бойынша)

| # | Не істеу | Приоритет |
|---|---------|-----------|
| 1 | JWT secret → startup fail | 🔴 |
| 2 | Offer accept → atomic transaction | 🔴 |
| 3 | Trip booking → atomic seat check | 🔴 |
| 4 | List endpoints → pagination | 🔴 |
| 5 | Offer accept → seller authorization | 🟠 |
| 6 | Offer accept → idempotency check | 🟠 |
| 7 | ProofEvent → role guard | 🟠 |
| 8 | Market acceptOffer → transaction | 🟠 |
| 9 | Тест деректерді алып тастау | 🟠 |
| 10 | API қателерге user-facing хабарлама | 🟠 |
| 11 | Loading + empty states | 🟡 |
| 12 | Password validation күшейту | 🟡 |
| 13 | Database indexes | 🟡 |
| 14 | Accessibility labels | 🟡 |
