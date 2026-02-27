# Локалды және демо нұсқа — қалай жұмыс істеу керек

## 1. Репо мен локалды компьютерді бірдей ету (синхрондау)

### Локалдағы өзгерістерді GitHub-қа жіберу
```bash
cd /Users/ulagatsametai/Documents/Qunarly   # негізгі репо папкасы
git status
git add .
git commit -m "Өзгерістер сипаттамасы"
git push origin main
```

### GitHub-тағы өзгерістерді локалға алу
```bash
cd /Users/ulagatsametai/Documents/Qunarly
git pull origin main
```

### Бір компьютерде бірнеше жерде жұмыс істесеңіз (мысалы Cursor worktree)
- **Бір репо** — `Documents/Qunarly` (негізгі).
- **Worktree** — `.../worktrees/Qunarly/jsy` — бұл сол репоның басқа branch/көшірмесі.
- Өзгерістерді бірдей ету: worktree-да `git checkout main && git pull` немесе негізгі папкада жұмыс істеп, барлығын `git push` жасаңыз.

**Қағида:** Әрдайым бір «негізгі» папканы ашып жұмыс істеңіз (мысалы тек `Documents/Qunarly`), сонда репо мен локал әрқашан бірдей болады.

---

## 2. Демо нұсқаны көріп әзірлеу (локалды)

«Демо» — сіздің компьютеріңізде іске қосылған backend + mobile, көзбен көру үшін.

### А) Backend іске қосу (терминал 1)
```bash
cd qunarly-backend
npm ci
npx prisma migrate dev
npm run start:dev
```
Сервер: `http://localhost:3000`

### Б) Mobile (Expo) іске қосу (терминал 2)
```bash
cd qunarly-mobile
CI=0 npx expo start -c --lan
```
Содан кейін телефонда **Expo Go** арқылы QR-ды скандаңыз немесе эмуляторда ашыңыз.

### В) Mobile-ды локалды backend-ке қосу
Mobile қолданба **varsa** мына айнымалыларға қарай API-ға сұрау жібереді:

- `qunarly-mobile/.env` (жасаңыз, егер жоқ болса):
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
# Немесе телефонда тестілесеңіз (компьютердің IP-сі):
# EXPO_PUBLIC_API_BASE_URL=http://192.168.1.XXX:3000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=сіздің_карта_кілтіңіз
```

**Ескерту:** Физикалық телефонда «localhost» жұмыс істемейді — компьютердің желідегі IP-сін қойыңыз (мысалы `http://192.168.1.100:3000`). Оны терминалда көруге болады: `ifconfig` (Mac) немесе `ipconfig` (Windows).

---

## 3. Шығарылған демо (деплой) болса

Егер backend бір жерде деплой болса (мысалы `https://api.qunarly.kz`):

- `qunarly-mobile/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=https://api.qunarly.kz
```
Сонда mobile қолданба осы «демо» API-ға қосылып, нақты демо деректерін көрсетеді. Әзірлеу кезінде де осы URL-ді қойып, демо нұсқаны көре аласыз.

---

## Қорытынды

| Мақсат | Қадам |
|--------|--------|
| Репо мен локал бірдей болсын | Бір папкада жұмыс et (`Documents/Qunarly`), `git push` / `git pull` |
| Демо нұсқаны локалда көру | Backend + mobile іске қосыңыз, `.env`-та `EXPO_PUBLIC_API_BASE_URL` беріңіз |
| Деплой болған демоға қосылу | `.env`-та деплой URL қойыңыз (`EXPO_PUBLIC_API_BASE_URL=...`) |
