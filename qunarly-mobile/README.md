## Qunarly Mobile

### Expo Go (LAN)
1. Ескі процестерді тоқтатыңыз:
   - `lsof -i :8081`
   - `kill -9 <PID>`
2. Expo Go үшін LAN режимін қосыңыз:
   - `CI=0 npx expo start -c --lan`
   - Егер LAN шықпаса: `npx expo start -c --tunnel`
3. Терминалда `exp://<YOUR_LAN_IP>:8081` шығуы керек.
4. iPhone → Expo Go → **Enter URL manually**:
   - `exp://<YOUR_LAN_IP>:8081`
5. Expo Go ішінде **recently opened** ескі линктерді қолданбаңыз — тек жаңа QR/URL.

Ескерту:
- `exp+...` көрсетілсе — бұл dev client, Expo Go үшін жарамсыз. Міндетті түрде `exp://` болуы керек.
- Егер QR шықпаса, `CI=0` бар екенін тексеріңіз.

### LAN диагностика (macOS firewall)
- Порт 8081 тыңдап тұр ма:
  - `lsof -i :8081`
- Firewall қосулы болса, **Node/Expo** үшін рұқсат беріңіз:
  - System Settings → Network → Firewall → Options → allow Node/Expo

### API base URL (IP ауысқанда / басқа роутер)
IP hardcode жоқ. Төмендегіні қолдануға болады:
- `EXPO_PUBLIC_API_BASE_URL` (толық URL)
- немесе `EXPO_PUBLIC_API_HOST` + `EXPO_PUBLIC_API_PORT`

**Басқа роутермен** (Wi‑Fi) кіргенде: телефон бэкендке жетуі үшін `.env`-та `EXPO_PUBLIC_API_HOST`-ты осы роутердегі **компьютеріңіздің IP** мекенжайына қойыңыз (мысалы `192.168.1.10`). Бэкенд сол желіде `npm run start:dev` іске қосылған болуы керек.

Мысалы `.env`:
```
EXPO_PUBLIC_API_HOST=192.168.0.105
EXPO_PUBLIC_API_PORT=3000
```

### Google Maps (dev)
1. `.env` ішінде `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` мәнін беріңіз.
2. GCP-де мына API-лар ENABLE болуы керек:
   - Maps SDK for iOS
   - Maps SDK for Android
   - Places API (New)
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Roads API
3. Dev үшін уақытша:
   - Application restrictions: None
   - API restrictions: тек жоғарыдағы API-лар

### Google Maps (prod)
Prod-қа шыққанда міндетті түрде шектеулер қойыңыз:
- iOS: `app.json`/`app.config.ts` ішінде `ios.bundleIdentifier` мәнін қойып, сол Bundle ID-ге restriction беріңіз.
- Android: `android.package` мәнін қойып, сол package name + SHA-1 бойынша restriction беріңіз.
- SHA-1: EAS/Android keystore-тан аласыз (EAS build credentials).

### Ескерту
Бұл жоба Google Places Text Search арқылы адрес іздейді және Maps SDK арқылы карта көрсетеді.

### QR handoff (эстафета)
1. Қабылдаушы `Қабылдау QR` экранында токен шығарады (2 минут).
2. Жеткізуші `Сканерлеп тапсыру` арқылы QR сканерлейді.
3. Backend GPS арақашықтықты (<=100м) тексереді, token one-time.
