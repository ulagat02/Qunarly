import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { useTheme } from '@/src/mobile/theme';
import MapPicker from '@/src/mobile/components/MapPicker';
import { useUserProfile } from '@/src/mobile/store/userProfile';
import { ensureRoute } from '@/src/mobile/lib/taxiRoutes';
import {
  EmptyQueueState,
  QueueCarousel,
  QueueNextCard,
  QueuePassenger,
} from '@/src/mobile/components/taxi/QueueCards';

const mapsModule = Platform.OS === 'web' ? null : require('react-native-maps');
const MapView = mapsModule ? mapsModule.default : null;
const Marker = mapsModule ? mapsModule.Marker : null;
const Polyline = mapsModule ? mapsModule.Polyline : null;
const UrlTile = mapsModule ? mapsModule.UrlTile : null;


type Hub = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
};

type TaxiRoute = {
  id: string;
  fromHub?: Hub;
  toHub?: Hub;
};

type DriverQueue = {
  status: 'IN_QUEUE' | 'OFFERED' | 'ON_TRIP' | 'OFFLINE' | 'REMOVED_INACTIVE';
  availableSeats?: number | null;
  joinedAt?: string;
};

type QueueDriver = {
  driverId: string;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: 'IN_QUEUE' | 'OFFERED' | 'ON_TRIP' | 'OFFLINE' | 'REMOVED_INACTIVE';
  availableSeats: number;
  capacity: number;
  joinedAt: string;
};

type DriverOffer = {
  id: string;
  status: 'PENDING';
  expiresAt?: string;
  request: {
    id: string;
    pickupText?: string | null;
    seats?: number | null;
    cargoType?: 'NONE' | 'SMALL' | 'LARGE';
    departureType?: 'TODAY' | 'TOMORROW' | 'SPECIFIC' | 'FILL';
    passenger?: { id: string; phone?: string | null; displayName?: string | null; firstName?: string | null };
  };
  route: TaxiRoute;
};

type RideRequest = {
  id: string;
  status:
    | 'PENDING'
    | 'OFFER_SENT'
    | 'MATCHED'
    | 'CONFIRMED'
    | 'DRIVER_EN_ROUTE'
    | 'IN_RIDE'
    | 'COMPLETED'
    | 'CANCELLED_BY_PASSENGER'
    | 'REMOVED_BY_DRIVER'
    | 'NO_SHOW'
    | 'EXPIRED';
  pickupText?: string | null;
  seats?: number | null;
  cargoType?: 'NONE' | 'SMALL' | 'LARGE';
  departureType?: 'TODAY' | 'TOMORROW';
  assignedDriver?: { id: string; phone?: string | null; displayName?: string | null; avatarUrl?: string | null } | null;
  route?: TaxiRoute;
};

type DriverActiveRequest = RideRequest & {
  passenger?: { id: string; phone?: string | null; displayName?: string | null; avatarUrl?: string | null } | null;
};

type QueuePassengerApi = {
  id: string;
  userId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  seatsRequested: number;
  pickupLabel?: string | null;
  departLabel?: string | null;
  status:
    | 'PENDING'
    | 'MATCHED'
    | 'CANCELLED_BY_PASSENGER'
    | 'REMOVED_BY_DRIVER'
    | 'NO_SHOW'
    | 'EXPIRED';
};

type QueueStatusResponse = {
  queue: DriverQueue | null;
  passengerCount: number;
};

type CommunityVillage = {
  id: string;
  nameDisplay: string;
  lat: number;
  lng: number;
};

const MODE_KEY = 'taxi_mode';
const DEFAULT_MODE: 'passenger' | 'driver' = 'passenger';

export function TaxiFlowScreen({ forcedMode }: { forcedMode?: 'passenger' | 'driver' }) {
  const { theme } = useTheme();
  const { profile } = useUserProfile();
  const normalizeHub = (hub: any): CommunityVillage => ({
    id: hub.id,
    nameDisplay: hub.nameDisplay ?? hub.name ?? 'Белгісіз',
    lat: hub.lat,
    lng: hub.lng,
  });
  const [routes, setRoutes] = useState<TaxiRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [pickupText, setPickupText] = useState('');
  const [seats, setSeats] = useState('1');
  const [mode, setMode] = useState<'passenger' | 'driver'>(forcedMode ?? DEFAULT_MODE);
  const [currentVillage, setCurrentVillage] = useState<CommunityVillage | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [queueStatus, setQueueStatus] = useState<DriverQueue | null>(null);
  const [passengerCount, setPassengerCount] = useState(0);
  const [pendingOffers, setPendingOffers] = useState<DriverOffer[]>([]);
  const [queuePassengers, setQueuePassengers] = useState<QueuePassenger[]>([]);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [villageName, setVillageName] = useState('');
  const [cargoType, setCargoType] = useState<'NONE' | 'SMALL' | 'LARGE'>('NONE');
  const [requestMeta, setRequestMeta] = useState<{ queuePosition?: number; routeStatus?: string } | null>(null);
  const [capacity, setCapacity] = useState('4');
  const [pickupMode, setPickupMode] = useState<'preset' | 'custom'>('preset');
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [nearbyHubs, setNearbyHubs] = useState<CommunityVillage[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<CommunityVillage | null>(null);
  const [confidence, setConfidence] = useState<'HIGH' | 'LOW' | 'NONE'>('NONE');
  const [nearbyRadius, setNearbyRadius] = useState(5000);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [destHubName, setDestHubName] = useState('');
  const [queueDrivers, setQueueDrivers] = useState<QueueDriver[]>([]);
  const [showHubActions, setShowHubActions] = useState(false);
  const [showDestActions, setShowDestActions] = useState(false);
  const [showOnTheWayPrompt, setShowOnTheWayPrompt] = useState(false);
  const [queueJoinedAt, setQueueJoinedAt] = useState<number | null>(null);
  const [queuePromptCount, setQueuePromptCount] = useState(0);
  const [queueLastPromptAt, setQueueLastPromptAt] = useState<number | null>(null);
  const [passengerRequest, setPassengerRequest] = useState<RideRequest | null>(null);
  const [showPassengerConfirm, setShowPassengerConfirm] = useState(false);
  const [driverActiveRequest, setDriverActiveRequest] = useState<DriverActiveRequest | null>(null);
  const [offerCountdown, setOfferCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (forcedMode) {
      setMode(forcedMode);
      return;
    }
    AsyncStorage.getItem(MODE_KEY).then((stored) => {
      if (stored === 'passenger' || stored === 'driver') {
        setMode(stored);
      }
    });
  }, [forcedMode]);

  useEffect(() => {
    if (forcedMode) return;
    AsyncStorage.setItem(MODE_KEY, mode).catch(() => undefined);
  }, [mode, forcedMode]);

  const loadRoutes = async (fromVillageId?: string, modeParam: 'passenger' | 'driver' = mode) => {
    try {
      const response = await api.get('/taxi/routes', {
        params: {
          ...(fromVillageId ? { origin: fromVillageId } : {}),
          mode: modeParam,
        },
      });
      const items = response.data ?? [];
      setRoutes(items);
      if (!items.length) {
        setSelectedRouteId(null);
      } else if (!selectedRouteId || !items.find((route) => route.id === selectedRouteId)) {
        setSelectedRouteId(items[0].id);
      }
    } catch (error) {
      console.log('[Taxi] routes failed', error);
    }
  };

  const loadQueueDrivers = async (routeId: string) => {
    try {
      const res = await api.get('/taxi/queue/drivers', { params: { routeId } });
      setQueueDrivers(res.data ?? []);
    } catch (error) {
      console.log('[Taxi] queue drivers failed', error);
    }
  };

  const loadCurrentVillage = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') return;
      
      let position = await Location.getLastKnownPositionAsync({});
      if (!position) {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLocationCoords({ lat, lng });

      const response = await api.get('/presence/resolve-hub', {
        params: { lat, lng },
      });
      
      const { confidence: conf, hubId, nearby } = response.data;
      setConfidence(conf);
      setNearbyHubs((nearby || []).map((hub: any) => normalizeHub(hub)));

      if (conf === 'HIGH' && hubId) {
        const hub = (nearby || []).find((h: any) => h.id === hubId);
        if (hub) {
          setCurrentVillage(normalizeHub(hub));
          await loadRoutes(hub.id, mode);
        }
      } else if ((nearby || []).length > 0) {
        const fallbackHub = (nearby || [])[0];
        setCurrentVillage(normalizeHub(fallbackHub));
        await loadRoutes(fallbackHub.id, mode);
      } else {
        setCurrentVillage(null);
        setRoutes([]);
        setSelectedRouteId(null);
      }
    } catch (error) {
      console.log('[Taxi] resolve hub failed', error);
    }
  };

  const loadNearbyHubs = async (radius = 5000) => {
    if (!locationCoords) return;
    try {
      const response = await api.get('/hubs/nearby', {
        params: { lat: locationCoords.lat, lng: locationCoords.lng, radius },
      });
      setNearbyHubs((response.data ?? []).map((hub: any) => normalizeHub(hub)));
      setNearbyRadius(radius);
    } catch (error) {
      console.log('[Taxi] nearby hubs failed', error);
    }
  };

  useEffect(() => {
    loadCurrentVillage();
  }, []);


  useEffect(() => {
    if (!lastRequestId) {
      setPassengerRequest(null);
      return;
    }
    let cancelled = false;
    const loadRequest = async () => {
      try {
        const response = await api.get(`/taxi/requests/${lastRequestId}`);
        if (!cancelled) {
          setPassengerRequest(response.data ?? null);
        }
      } catch (error) {
        console.log('[Taxi] request status failed', error);
      }
    };
    void loadRequest();
    const interval = setInterval(loadRequest, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lastRequestId]);

  const refreshDriverState = async () => {
    if (mode !== 'driver' || !selectedRouteId) return;
    try {
      const [queueResponse, offersResponse, passengersResponse, activeRequestResponse] = await Promise.all([
        api.get('/drivers/queue/status', { params: { routeId: selectedRouteId } }),
        api.get('/drivers/offers/pending'),
        api.get('/drivers/queue/passengers', { params: { routeId: selectedRouteId, expireMinutes: 15 } }),
        api.get('/drivers/requests/active'),
      ]);
      const queueData = (queueResponse.data ?? null) as QueueStatusResponse | null;
      setQueueStatus(queueData?.queue ?? null);
      setPassengerCount(queueData?.passengerCount ?? 0);
      setPendingOffers(offersResponse.data ?? []);
      setDriverActiveRequest(activeRequestResponse.data ?? null);
      const passengers = (passengersResponse.data ?? []) as QueuePassengerApi[];
      setQueuePassengers(
        passengers.map((item) => ({
          id: item.id,
          userId: item.userId,
          displayName: item.displayName,
          avatarUrl: item.avatarUrl,
          seatsRequested: item.seatsRequested,
          pickupLabel: item.pickupLabel,
          departLabel: item.departLabel,
          status: item.status,
        })),
      );
    } catch (error) {
      console.log('[Taxi] driver state failed', error);
    }
  };

  useEffect(() => {
    if (!selectedRouteId) {
      setQueueStatus(null);
      setPassengerCount(0);
      setPendingOffers([]);
      setQueueDrivers([]);
      setQueueJoinedAt(null);
      setQueuePromptCount(0);
      setQueueLastPromptAt(null);
      return;
    }
    refreshDriverState();
  }, [mode, selectedRouteId]);

  useEffect(() => {
    if (!selectedRouteId || mode !== 'driver') return;
    const loadQueueTimerState = async () => {
      const [joined, count, last] = await Promise.all([
        AsyncStorage.getItem(`driver_queue_joined_at_${selectedRouteId}`),
        AsyncStorage.getItem(`driver_queue_prompt_count_${selectedRouteId}`),
        AsyncStorage.getItem(`driver_queue_last_prompt_${selectedRouteId}`),
      ]);
      setQueueJoinedAt(joined ? Number(joined) : null);
      setQueuePromptCount(count ? Number(count) : 0);
      setQueueLastPromptAt(last ? Number(last) : null);
    };
    loadQueueTimerState().catch(() => undefined);
  }, [selectedRouteId, mode]);

  useEffect(() => {
    if (!selectedRouteId) return;
    const route = routes.find((item) => item.id === selectedRouteId);
    if (!route?.toHub) return;
    setSelectedDestination({
      id: route.toHub.id,
      nameDisplay: route.toHub.name,
      lat: route.toHub.lat,
      lng: route.toHub.lng,
    });
  }, [routes, selectedRouteId]);

  useEffect(() => {
    if (mode !== 'driver' || !selectedRouteId) return;
    const timer = setInterval(() => {
      refreshDriverState();
    }, 8000);
    return () => clearInterval(timer);
  }, [mode, selectedRouteId]);

  // 30s ping while driver is in queue (IN_QUEUE or OFFERED)
  const PING_INTERVAL_MS = 30 * 1000;
  useEffect(() => {
    if (mode !== 'driver' || !selectedRouteId) return;
    const status = queueStatus?.status;
    if (status !== 'IN_QUEUE' && status !== 'OFFERED') return;
    const ping = () => {
      api.post('/drivers/queue/ping', { routeId: selectedRouteId }).catch((err) => {
        console.log('[Taxi] queue ping failed', err);
      });
    };
    ping();
    const timer = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mode, selectedRouteId, queueStatus?.status]);

  useEffect(() => {
    if (mode !== 'driver' || !selectedRouteId) return;
    const timer = setInterval(async () => {
      if (!queueStatus || queueStatus.status !== 'IN_QUEUE') return;
      const joinedAt = queueJoinedAt ?? (queueStatus.joinedAt ? new Date(queueStatus.joinedAt).getTime() : null);
      if (!joinedAt) return;
      const now = Date.now();
      const elapsed = now - joinedAt;

      if (elapsed >= 30 * 60 * 1000 && queuePromptCount >= 3) {
        try {
          await api.post('/drivers/queue/inactive', { routeId: selectedRouteId });
          await Promise.all([
            AsyncStorage.removeItem(`driver_queue_joined_at_${selectedRouteId}`),
            AsyncStorage.removeItem(`driver_queue_prompt_count_${selectedRouteId}`),
            AsyncStorage.removeItem(`driver_queue_last_prompt_${selectedRouteId}`),
          ]);
          await cancelOnTheWayNotifications(selectedRouteId);
          setShowOnTheWayPrompt(false);
          setQueueJoinedAt(null);
          setQueuePromptCount(0);
          setQueueLastPromptAt(null);
          await refreshDriverState();
        } catch (error) {
          console.log('[Taxi] auto inactive failed', error);
        }
        return;
      }

      if (elapsed >= 15 * 60 * 1000 && queuePromptCount < 3) {
        const lastPromptAt = queueLastPromptAt ?? 0;
        if (now - lastPromptAt >= 5 * 60 * 1000) {
          setShowOnTheWayPrompt(true);
          const nextCount = queuePromptCount + 1;
          setQueuePromptCount(nextCount);
          setQueueLastPromptAt(now);
          await Promise.all([
            AsyncStorage.setItem(`driver_queue_prompt_count_${selectedRouteId}`, String(nextCount)),
            AsyncStorage.setItem(`driver_queue_last_prompt_${selectedRouteId}`, String(now)),
            AsyncStorage.setItem(`driver_queue_joined_at_${selectedRouteId}`, String(joinedAt)),
          ]);
        }
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [mode, selectedRouteId, queueStatus, queueJoinedAt, queuePromptCount, queueLastPromptAt]);

  useEffect(() => {
    if (mode !== 'passenger' || !selectedRouteId) return;
    loadQueueDrivers(selectedRouteId);
    const timer = setInterval(() => {
      loadQueueDrivers(selectedRouteId);
    }, 8000);
    return () => clearInterval(timer);
  }, [mode, selectedRouteId]);

  useEffect(() => {
    if (!selectedDestination?.id || !currentVillage?.id) return;
    if (selectedDestination.id === currentVillage.id) return;
    handleEnsureRoute();
  }, [selectedDestination?.id]);


  const selectedRoute = routes.find((route) => route.id === selectedRouteId);
  const activeOffer = pendingOffers[0];
  const pendingPassengers = queuePassengers.filter((item) => item.status === 'PENDING');
  const confirmedPassengers = queuePassengers.filter((item) => item.status === 'MATCHED');
  const nextPassenger = pendingPassengers[0] ?? null;
  const nextPassengers = pendingPassengers.slice(1);

  useEffect(() => {
    if (!activeOffer?.expiresAt) {
      setOfferCountdown(null);
      return;
    }
    const updateCountdown = () => {
      const diff = new Date(activeOffer.expiresAt as string).getTime() - Date.now();
      setOfferCountdown(Math.max(0, Math.ceil(diff / 1000)));
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeOffer?.id, activeOffer?.expiresAt]);

  const handleAddVillage = async (coords: { lat: number; lng: number }) => {
    if (!profile?.regionId || !profile?.districtId) {
      Alert.alert('Қате', 'Алдымен профильде облыс және аудан таңдаңыз.');
      return;
    }
    if (!villageName.trim()) {
      Alert.alert('Қате', 'Ауыл атауын енгізіңіз.');
      return;
    }
    try {
      const response = await api.post('/hubs', {
        name: villageName.trim(),
        lat: coords.lat,
        lng: coords.lng,
        radiusMeters: 800,
        isActive: true,
      });
      if (response.data?.id) {
        setCurrentVillage({
          id: response.data.id,
          nameDisplay: response.data.name,
          lat: response.data.lat,
          lng: response.data.lng,
        });
        setShowMapPicker(false);
        setVillageName('');
        await loadRoutes(response.data.id);
      }
    } catch (error: any) {
      Alert.alert('Қате', 'Хаб қосылмады');
    }
  };

  const handleAddDestination = async (coords: { lat: number; lng: number }) => {
    if (!currentVillage?.id) {
      Alert.alert('Қате', 'Алдымен бастапқы хабты таңдаңыз');
      return;
    }
    if (!destHubName.trim()) {
      Alert.alert('Қате', 'Баратын нүкте атауын енгізіңіз');
      return;
    }

    const confirmCreate = async () => {
      try {
        const resB = await api.post('/hubs', {
          name: destHubName.trim(),
          lat: coords.lat,
          lng: coords.lng,
          radiusMeters: 800,
          isActive: true,
        });

        const hubB = resB.data;

        if (hubB.id === currentVillage.id) {
          Alert.alert('Қате', 'Бастапқы және соңғы нүкте бірдей болмауы керек');
          return;
        }

        await api.post('/routes', {
          name: `${currentVillage.nameDisplay} → ${hubB.name}`,
          fromHubId: currentVillage.id,
          toHubId: hubB.id,
          scheduleType: 'QUEUE',
        });

        setSelectedDestination({
          id: hubB.id,
          nameDisplay: hubB.name,
          lat: hubB.lat,
          lng: hubB.lng,
        });
        setShowDestPicker(false);
        setDestHubName('');
        await loadRoutes(currentVillage.id, mode);

        if (Platform.OS === 'android') {
          ToastAndroid.show('Бағыт қосылды', ToastAndroid.SHORT);
        } else {
          Alert.alert('Сәтті', 'Бағыт қосылды');
        }
      } catch (error) {
        Alert.alert('Қате', 'Баратын нүкте қосылмады');
      }
    };

    Alert.alert(
      'Маршрут тіркеу',
      `Бастапқы: ${currentVillage.nameDisplay}\nБаратын нүкте: ${destHubName.trim()}`,
      [
        { text: 'Болдырмау', style: 'cancel' },
        { text: 'Тіркеу', onPress: () => void confirmCreate() },
      ],
    );
  };

  const handleRequestHubRemoval = async (hub?: CommunityVillage | null) => {
    const target = hub ?? currentVillage;
    if (!target?.id) return;
    Alert.alert(
      'Хабты жоюды сұрау',
      `Хаб: ${target.nameDisplay}\nӘкімшіге жою туралы сұраныс жіберіледі.`,
      [
        { text: 'Болдырмау', style: 'cancel' },
        {
          text: 'Жіберу',
          onPress: async () => {
            try {
              await api.post(`/hubs/${target.id}/request-removal`);
              Alert.alert('Сұраныс жіберілді', 'Әкімшіге хабарлама жіберілді.');
            } catch (error) {
              Alert.alert('Қате', 'Сұраныс жіберілмеді');
            }
          },
        },
      ],
    );
  };

  const scheduleOnTheWayNotifications = async (routeId: string) => {
    if (Platform.OS === 'web') return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const request = await Notifications.requestPermissionsAsync();
        finalStatus = request.status;
      }
      if (finalStatus !== 'granted') return;
      const scheduleMinutes = [15, 20, 25];
      const ids = await Promise.all(
        scheduleMinutes.map((minutes) =>
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Жолға шықтың ба?',
              body: 'Кезекте 15 минут болды. Егер шықсаң, “Жүрдім” бас.',
              sound: true,
            },
            trigger: { seconds: minutes * 60 },
          }),
        ),
      );
      await AsyncStorage.setItem(`driver_queue_notifications_${routeId}`, JSON.stringify(ids));
    } catch (error) {
      console.log('[Taxi] schedule notifications failed', error);
    }
  };

  const cancelOnTheWayNotifications = async (routeId: string) => {
    if (Platform.OS === 'web') return;
    try {
      const stored = await AsyncStorage.getItem(`driver_queue_notifications_${routeId}`);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
      }
      await AsyncStorage.removeItem(`driver_queue_notifications_${routeId}`);
    } catch (error) {
      console.log('[Taxi] cancel notifications failed', error);
    }
  };

  const handleOpenPassengerConfirm = () => {
    if (!selectedRouteId) {
      Alert.alert('Қате', 'Бағыт таңдаңыз.');
      return;
    }
    if (!pickupText.trim()) {
      Alert.alert('Қате', 'Кездесу орнын көрсетіңіз.');
      return;
    }
    const seatsNumber = Number(seats);
    if (!Number.isFinite(seatsNumber) || seatsNumber < 1) {
      Alert.alert('Қате', 'Адам саны дұрыс емес.');
      return;
    }
    if (seatsNumber > 8) {
      Alert.alert('Қате', 'Адам саны 8-ден аспауы керек.');
      return;
    }
    setShowPassengerConfirm(true);
  };

  const handleCreateRequest = async () => {
    if (!selectedRouteId) {
      return;
    }
    setShowPassengerConfirm(false);
    const seatsNumber = Number(seats);
    try {
      const response = await api.post('/taxi/requests', {
        routeId: selectedRouteId,
        pickupText: pickupText.trim(),
        seats: seatsNumber,
        cargoType,
        departureType: 'TODAY',
        waitUntilFull: false,
      });
      setRequestMeta({
        queuePosition: response.data?.queuePosition,
        routeStatus: response.data?.routeStatus,
      });
      setLastRequestId(response.data?.id ?? null);
      setPassengerRequest(response.data ?? null);
    } catch (error) {
      Alert.alert('Қате', 'Сұраныс жіберілмеді');
    }
  };

  const handleEnsureRoute = async () => {
    if (!currentVillage?.id || !selectedDestination?.id) return;
    if (currentVillage.id === selectedDestination.id) {
      console.warn('[Taxi] origin and dest are the same, skipping ensureRoute');
      return;
    }
    try {
      const route = await ensureRoute({
        originHubId: currentVillage.id,
        destHubId: selectedDestination.id,
      });
      if (route?.id) {
        setSelectedRouteId(route.id);
        await loadRoutes(currentVillage.id, mode);
      }
    } catch (error: any) {
      console.error('[Taxi] handleEnsureRoute failed', error);
    }
  };

  const handleCancelRequest = async () => {
    if (!lastRequestId) return;
    try {
      await api.post(`/taxi/requests/${lastRequestId}/cancel`);
      setSnackbar('Сұраныс тоқтатылды');
      setRequestMeta(null);
      setLastRequestId(null);
      setPassengerRequest(null);
      setShowPassengerConfirm(false);
    } catch (error) {
      Alert.alert('Қате', 'Кезектен шығу мүмкін болмады');
    }
  };

  const handleCancelRequestConfirm = () => {
    Alert.alert('Бас тарту', 'Тапсырыстан бас тартасыз ба?', [
      { text: 'Жоқ', style: 'cancel' },
      { text: 'Иә', style: 'destructive', onPress: handleCancelRequest },
    ]);
  };

  const handlePassengerReady = async () => {
    if (!lastRequestId) return;
    try {
      await api.post(`/taxi/requests/${lastRequestId}/ready`);
      setSnackbar('Жүргізушіге хабар жіберілді');
    } catch (error) {
      Alert.alert('Қате', 'Хабар жіберілмеді');
    }
  };

  const handleJoinQueue = async () => {
    if (!currentVillage?.id || !selectedDestination?.id) {
      Alert.alert('Қате', 'Алдымен баратын нүктені таңдаңыз немесе қосыңыз');
      return;
    }
    if (!selectedRouteId) {
      Alert.alert('Қате', 'Бағыт таңдаңыз немесе ашыңыз.');
      return;
    }
    try {
      const seatsNumber = Number(capacity);
      await api.post('/drivers/queue/join', {
        routeId: selectedRouteId,
        capacity: Number.isFinite(seatsNumber) ? seatsNumber : 4,
      });
      const joinedAt = Date.now();
      await Promise.all([
        AsyncStorage.setItem(`driver_queue_joined_at_${selectedRouteId}`, String(joinedAt)),
        AsyncStorage.setItem(`driver_queue_prompt_count_${selectedRouteId}`, '0'),
        AsyncStorage.setItem(`driver_queue_last_prompt_${selectedRouteId}`, '0'),
      ]);
      await scheduleOnTheWayNotifications(selectedRouteId);
      setQueueJoinedAt(joinedAt);
      setQueuePromptCount(0);
      setQueueLastPromptAt(0);
      await refreshDriverState();
      Alert.alert('Кезекке қосылды', 'Жолаушылар сұранысы күтілуде.');
    } catch (error) {
      Alert.alert('Қате', 'Кезекке қосылмады');
    }
  };

  const handleQueueOnTheWay = async () => {
    if (!selectedRouteId) return;
    try {
      await api.post('/drivers/queue/on-the-way', { routeId: selectedRouteId });
      await Promise.all([
        AsyncStorage.removeItem(`driver_queue_joined_at_${selectedRouteId}`),
        AsyncStorage.removeItem(`driver_queue_prompt_count_${selectedRouteId}`),
        AsyncStorage.removeItem(`driver_queue_last_prompt_${selectedRouteId}`),
      ]);
      await cancelOnTheWayNotifications(selectedRouteId);
      setShowOnTheWayPrompt(false);
      setQueueJoinedAt(null);
      setQueuePromptCount(0);
      setQueueLastPromptAt(null);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Күй өзгертілмеді');
    }
  };

  const handlePassengerPickedUp = async () => {
    if (!lastRequestId) return;
    try {
      await api.post(`/taxi/requests/${lastRequestId}/picked-up`);
    } catch (error) {
      Alert.alert('Қате', 'Күй өзгертілмеді');
    }
  };

  const handleDriverOnTheWay = async (requestId: string) => {
    try {
      await api.post(`/taxi/requests/${requestId}/on-the-way`);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Күй өзгертілмеді');
    }
  };

  const handleDriverPickedUp = async (requestId: string) => {
    try {
      await api.post(`/drivers/requests/${requestId}/picked-up`);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Күй өзгертілмеді');
    }
  };

  const handleDriverComplete = async (requestId: string) => {
    try {
      await api.post(`/taxi/requests/${requestId}/complete`);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Сапарды аяқтау мүмкін болмады');
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeOffer) return;
    try {
      await api.post(`/drivers/offers/${activeOffer.id}/accept`);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Ұсыныс қабылданбады');
    }
  };

  const handleRejectOffer = async () => {
    if (!activeOffer) return;
    try {
      await api.post(`/drivers/offers/${activeOffer.id}/reject`);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Ұсыныс қабылданбады');
    }
  };

  const handleConfirmPassenger = async (requestId: string) => {
    try {
      await api.post(`/drivers/queue/passengers/${requestId}/confirm`);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Растау мүмкін болмады');
    }
  };

  const handleSkipPassenger = async (requestId: string) => {
    try {
      await api.post(`/drivers/queue/passengers/${requestId}/skip`);
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Өткізу мүмкін болмады');
    }
  };

  const handleRemoveConfirmed = async (requestId: string) => {
    try {
      await api.post(`/drivers/queue/passengers/${requestId}/remove`, { reason: 'REMOVED_BY_DRIVER' });
      await refreshDriverState();
    } catch (error) {
      Alert.alert('Қате', 'Орын босату мүмкін болмады');
    }
  };

  const modeLabel = useMemo(() => (mode === 'passenger' ? 'Жолаушы' : 'Жүргізуші'), [mode]);
  const nextDriver = queueDrivers[0] ?? null;
  const otherDrivers = queueDrivers.slice(1);
  const queueBadges = requestMeta?.queuePosition
    ? {
        position: requestMeta.queuePosition,
        ahead: Math.max(0, requestMeta.queuePosition - 1),
      }
    : null;
  const queueProgress = queueBadges
    ? (() => {
        const blocks = 5;
        const filled = Math.max(1, blocks - Math.min(queueBadges.ahead, blocks));
        return '▓'.repeat(filled) + '░'.repeat(blocks - filled);
      })()
    : null;
  const passengerStep = useMemo(() => {
    if (showPassengerConfirm) return 'P1';
    if (!passengerRequest && lastRequestId) return 'P2';
    if (!passengerRequest) return 'P0';
    switch (passengerRequest.status) {
      case 'PENDING':
      case 'OFFER_SENT':
        return 'P2';
      case 'MATCHED':
        return 'P3';
      case 'DRIVER_EN_ROUTE':
        return 'P4';
      case 'CONFIRMED':
        return 'P5';
      case 'IN_RIDE':
        return 'P6';
      case 'COMPLETED':
        return 'P7';
      default:
        return 'P0';
    }
  }, [lastRequestId, passengerRequest, showPassengerConfirm]);
  const driverStep = useMemo(() => {
    if (activeOffer) return 'D2';
    if (driverActiveRequest?.status === 'MATCHED' || driverActiveRequest?.status === 'CONFIRMED') return 'D3';
    if (driverActiveRequest?.status === 'DRIVER_EN_ROUTE') return 'D4';
    if (driverActiveRequest?.status === 'IN_RIDE') return 'D5';
    if (driverActiveRequest?.status === 'COMPLETED') return 'D6';
    if (queueStatus?.status) return 'D1';
    return 'D0';
  }, [activeOffer, driverActiveRequest, queueStatus]);

  const mapRegion = useMemo(() => {
    const lat = currentVillage?.lat ?? locationCoords?.lat ?? 43.238949;
    const lng = currentVillage?.lng ?? locationCoords?.lng ?? 76.889709;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [currentVillage?.lat, currentVillage?.lng, locationCoords?.lat, locationCoords?.lng]);
  const seatsNumber = Number(seats);
  const isPassengerReady =
    !!selectedRouteId && pickupText.trim().length > 0 && Number.isFinite(seatsNumber) && seatsNumber >= 1 && seatsNumber <= 8;
  const passengerRouteFrom = passengerRequest?.route?.fromHub?.name ?? currentVillage?.nameDisplay ?? '—';
  const passengerRouteTo = passengerRequest?.route?.toHub?.name ?? selectedDestination?.nameDisplay ?? '—';
  const passengerPickup = passengerRequest?.pickupText ?? pickupText;
  const passengerSeats = passengerRequest?.seats ?? seatsNumber;
  const passengerCargo = passengerRequest?.cargoType ?? cargoType;
  const assignedQueue = passengerRequest?.assignedDriver
    ? queueDrivers.find((driver) => driver.driverId === passengerRequest.assignedDriver?.id)
    : null;
  const driverRouteFrom = driverActiveRequest?.route?.fromHub?.name ?? currentVillage?.nameDisplay ?? '—';
  const driverRouteTo = driverActiveRequest?.route?.toHub?.name ?? selectedDestination?.nameDisplay ?? '—';
  const offerCountdownLabel =
    offerCountdown === null
      ? null
      : `${String(Math.floor(offerCountdown / 60)).padStart(2, '0')}:${String(
          offerCountdown % 60,
        ).padStart(2, '0')}`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        {!forcedMode ? (
          <>
            <View style={styles.modeRow}>
              {(['passenger', 'driver'] as const).map((item) => {
                const active = item === mode;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.background,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => setMode(item)}
                  >
                    <Text
                      style={{
                        color: active ? theme.colors.surface : theme.colors.text,
                        fontWeight: '600',
                      }}
                    >
                      {item === 'passenger' ? 'Жолаушы' : 'Жүргізуші'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.title, { color: theme.colors.text, marginTop: 8 }]}>{modeLabel}</Text>
          </>
        ) : (
          <Text style={[styles.title, { color: theme.colors.text }]}>{modeLabel}</Text>
        )}
        {currentVillage ? (
          <View style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowHubActions((prev) => !prev)}
              onLongPress={() => setShowHubActions(true)}
              style={[styles.chip, { backgroundColor: theme.colors.primaryMuted }]}
            >
              <Text style={{ color: theme.colors.text }}>Хаб: {currentVillage.nameDisplay}</Text>
            </TouchableOpacity>
            {showHubActions ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
                ]}
                onPress={() => handleRequestHubRemoval(currentVillage)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                  🗑 Жою
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.colors.mutedText }}>
              {nearbyHubs.length > 0
                ? 'Жақын маңда хаб бар. Хаб көрінбесе әкімшіге хабарласыңыз.'
                : 'Хаб анықталмады. Хабты өзгерту немесе алып тастау үшін әкімшіге хабарласыңыз.'}
            </Text>
            {mode === 'driver' && nearbyHubs.length === 0 && (
              <>
                <TextInput
                  style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                  placeholder="Хаб атауы"
                  placeholderTextColor={theme.colors.placeholder}
                  value={villageName}
                  onChangeText={setVillageName}
                />
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
                  ]}
                  onPress={() => setShowMapPicker(true)}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Хабты қосу (жүргізуші)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Бағыт таңдау</Text>
        {currentVillage ? (
          <View style={{ gap: 8 }}>
            {MapView && UrlTile && Marker && Polyline ? (
              <View style={{ height: 250, borderRadius: 16, overflow: 'hidden' }}>
                <MapView style={{ flex: 1 }} initialRegion={mapRegion}>
                  <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
                  <Marker
                    coordinate={{ latitude: currentVillage.lat, longitude: currentVillage.lng }}
                    title={`A: ${currentVillage.nameDisplay}`}
                    pinColor={theme.colors.primary}
                  />
                  {routes
                    .filter((r) => r.toHub?.lat && r.toHub?.lng && r.fromHub?.lat && r.fromHub?.lng)
                    .map((r) => {
                      const isActive = r.id === selectedRouteId;
                      const from = r.fromHub!;
                      const to = r.toHub!;
                      return (
                        <Polyline
                          key={r.id}
                          coordinates={[
                            { latitude: from.lat, longitude: from.lng },
                            { latitude: to.lat, longitude: to.lng },
                          ]}
                          strokeColor={isActive ? theme.colors.primary : theme.colors.border}
                          strokeWidth={isActive ? 4 : 2}
                        />
                      );
                    })}
                  {routes
                    .filter((r) => r.toHub?.lat && r.toHub?.lng)
                    .map((r) => (
                      <Marker
                        key={`to-${r.id}`}
                        coordinate={{ latitude: r.toHub!.lat, longitude: r.toHub!.lng }}
                        title={`B: ${r.toHub!.name}`}
                        pinColor={theme.colors.secondary ?? '#3B82F6'}
                      />
                    ))}
                </MapView>
                <View style={styles.mapOverlay} pointerEvents="none">
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                    📍 {currentVillage.nameDisplay}
                    {selectedDestination?.nameDisplay ? ` → ${selectedDestination.nameDisplay}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}
            <Text style={{ color: theme.colors.mutedText }}>
              Бастапқы: {currentVillage.nameDisplay}
            </Text>
            <Text style={styles.sectionLabel}>Қайда барамыз?</Text>
            <View style={styles.optionRow}>
              {routes.map((route) => {
                const dest = route.toHub;
                if (!dest) return null;
                const active = selectedDestination?.id === dest.id;
                return (
                  <TouchableOpacity
                    key={route.id}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.background,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedRouteId(route.id);
                      setSelectedDestination({
                        id: dest.id,
                        nameDisplay: dest.name,
                        lat: dest.lat,
                        lng: dest.lng,
                      });
                      setShowDestActions(false);
                    }}
                    onLongPress={() => {
                      setSelectedRouteId(route.id);
                      setSelectedDestination({
                        id: dest.id,
                        nameDisplay: dest.name,
                        lat: dest.lat,
                        lng: dest.lng,
                      });
                      setShowDestActions(true);
                    }}
                  >
                    <Text style={{ color: active ? theme.colors.surface : theme.colors.text }}>
                      {dest.name}
                      {active ? ' ✅' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {mode === 'driver' && (
                <TouchableOpacity
                  style={[styles.optionButton, { borderStyle: 'dashed', borderColor: theme.colors.primary }]}
                  onPress={() => {
                    if (!destHubName.trim()) {
                      Alert.alert('Назар аударыңыз', 'Алдымен баратын нүкте атауын жазыңыз');
                      return;
                    }
                    setShowDestPicker(true);
                  }}
                >
                  <Text style={{ color: theme.colors.primary }}>+ Баратын нүкте</Text>
                </TouchableOpacity>
              )}
            </View>
            {routes.length === 0 && mode === 'driver' && !showDestPicker && (
              <Text style={{ color: theme.colors.mutedText, fontSize: 13, marginTop: 4 }}>
                Бұл хабтан әлі бағыттар ашылмаған. Баратын нүкте атауын жазып, жаңа бағыт ашыңыз.
              </Text>
            )}
            {mode === 'driver' && (
              <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, marginTop: 8 }]}
                placeholder="Баратын нүкте атауы (мыс: Алматы)"
                placeholderTextColor={theme.colors.placeholder}
                value={destHubName}
                onChangeText={setDestHubName}
              />
            )}
            {selectedDestination && !routes.some(r => r.toHub?.id === selectedDestination.id) && (
              <Text style={{ color: theme.colors.error || '#DC2626', fontSize: 12 }}>
                Бұл бағыт бойынша маршрут жоқ. Сұраныс қалдыруға болады.
              </Text>
            )}
            {selectedDestination && showDestActions ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
                ]}
                onPress={() => handleRequestHubRemoval(selectedDestination)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                  🗑 Жою
                </Text>
              </TouchableOpacity>
            ) : null}
            <Text style={{ color: theme.colors.mutedText }}>
              Бағыт таңдалғанда автомат ашылады.
            </Text>
          </View>
        ) : (
          <Text style={{ color: theme.colors.mutedText }}>Ауыл анықталмады</Text>
        )}
        {routes.length === 0 && mode === 'passenger' && (
          <View style={{ gap: 8 }}>
            <Text style={{ color: theme.colors.mutedText }}>
              Бағытты ашу үшін бағыт таңдаңыз.
            </Text>
          </View>
        )}
      </View>

      {mode === 'passenger' ? (
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          {selectedRouteId ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionLabel}>Жүргізушілер кезегі</Text>
              {nextDriver ? (
                <View style={[styles.focusCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.primaryMuted }]}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>
                    👤 {nextDriver.displayName}
                  </Text>
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                    🚗 Бос орын: {nextDriver.availableSeats}/{nextDriver.capacity}
                  </Text>
                  {nextDriver.phone ? (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: theme.colors.primary }]}
                      onPress={() => Linking.openURL(`tel:${nextDriver.phone}`)}
                    >
                      <Text style={{ color: theme.colors.surface, fontWeight: '700' }}>📞 Қоңырау шалу</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: theme.colors.mutedText }}>Телефон нөмірі жоқ</Text>
                  )}
                </View>
              ) : (
                <Text style={{ color: theme.colors.mutedText }}>Қазір кезекте жүргізуші жоқ.</Text>
              )}

              {otherDrivers.length ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ color: theme.colors.mutedText }}>Кезектегі басқа жүргізушілер:</Text>
                  {otherDrivers.slice(0, 6).map((d, idx) => (
                    <View key={d.driverId} style={[styles.statusCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                        №{idx + 2} • {d.displayName}
                      </Text>
                      <Text style={{ color: theme.colors.mutedText }}>
                        Бос орын: {d.availableSeats}/{d.capacity}
                      </Text>
                      {d.phone ? (
                        <TouchableOpacity
                          style={[styles.button, { backgroundColor: theme.colors.primary }]}
                          onPress={() => Linking.openURL(`tel:${d.phone}`)}
                        >
                          <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Қоңырау шалу</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={{ color: theme.colors.mutedText }}>Алдымен бағыт таңдаңыз.</Text>
          )}

          <Text style={{ color: theme.colors.mutedText }}>
            Маршрут таңда — кезек ашылады, бірінші жүргізушіге бірден қоңырау шаласың.
          </Text>

          <Text style={styles.sectionLabel}>Кездесу орны</Text>
          <View style={styles.optionRow}>
            {['Дүкен қасы', 'Мешіт алды', 'Мектеп маңы', 'Үйім', 'Басқа'].map((label) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.optionButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: pickupText === label ? theme.colors.primary : theme.colors.background,
                  },
                ]}
                onPress={() => {
                  if (label === 'Басқа') {
                    setPickupMode('custom');
                    setPickupText('');
                  } else {
                    setPickupMode('preset');
                    setPickupText(label);
                  }
                }}
              >
                <Text style={{ color: pickupText === label ? theme.colors.surface : theme.colors.text }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {pickupMode === 'custom' ? (
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Кездесу орны (толық)"
              placeholderTextColor={theme.colors.placeholder}
              value={pickupText}
              onChangeText={setPickupText}
            />
          ) : null}

          <Text style={styles.sectionLabel}>Қанша адам барады?</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Адам саны"
            placeholderTextColor={theme.colors.placeholder}
            value={seats}
            onChangeText={setSeats}
            keyboardType="number-pad"
          />

          <Text style={styles.sectionLabel}>Жүк</Text>
          <View style={styles.optionRow}>
            {([
              { value: 'NONE', label: 'Жүк жоқ' },
              { value: 'SMALL', label: 'Жүк бар' },
              { value: 'LARGE', label: 'Үлкен жүк' },
            ] as const).map((item) => {
              const active = cargoType === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: active ? theme.colors.primary : theme.colors.background,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setCargoType(item.value)}
                >
                  <Text style={{ color: active ? theme.colors.surface : theme.colors.text }}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isPassengerReady ? theme.colors.primary : theme.colors.border },
            ]}
            onPress={handleOpenPassengerConfirm}
            disabled={!isPassengerReady}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Сұраныс жіберу</Text>
          </TouchableOpacity>
          {queueBadges ? (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: theme.colors.primaryMuted }]}>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>🟢 Кезек №{queueBadges.position}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.mutedText, fontWeight: '600' }}>⏳ Алдыңда: {queueBadges.ahead}</Text>
              </View>
              {queueProgress ? (
                <Text style={{ color: theme.colors.mutedText, fontWeight: '700' }}>{queueProgress}</Text>
              ) : null}
            </View>
          ) : null}
          {lastRequestId ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }]}
              onPress={handleCancelRequest}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Кезектен шығу</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={[styles.bottomSheet, { backgroundColor: theme.colors.surface }]}>
          <View
            style={[
              styles.queueFloating,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.primaryMuted },
            ]}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>
              Кезек статусы
            </Text>
            {currentVillage?.nameDisplay && selectedDestination?.nameDisplay ? (
              <Text style={{ color: theme.colors.text }}>
                {currentVillage.nameDisplay} → {selectedDestination.nameDisplay}
              </Text>
            ) : null}
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 18 }}>
              {queueStatus
                ? queueStatus.availableSeats === 0
                  ? 'ТОЛДЫ'
                  : 'КЕЗЕКТЕ'
                : 'OFFLINE'}
            </Text>
            <View style={styles.queueMetaRow}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                🚗 Бос орын: {queueStatus?.availableSeats ?? '—'}
              </Text>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                👥 Кезекте: {passengerCount}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Бос орын саны</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Орын саны"
            placeholderTextColor={theme.colors.placeholder}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor:
                  !currentVillage?.id || !selectedDestination?.id ? theme.colors.border : theme.colors.primary,
              },
            ]}
            onPress={handleJoinQueue}
            disabled={!currentVillage?.id || !selectedDestination?.id}
          >
            <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Кезекке тұру</Text>
          </TouchableOpacity>
          {activeOffer ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                Ұсыныс: {activeOffer.route.fromHub?.name ?? '—'} → {activeOffer.route.toHub?.name ?? '—'}
              </Text>
              <Text style={{ color: theme.colors.mutedText }}>
                Орын: {activeOffer.request?.seats ?? 1} • Жүк: {activeOffer.request?.cargoType ?? 'NONE'}
              </Text>
              <Text style={{ color: theme.colors.mutedText }}>
                Кездесу: {activeOffer.request?.pickupText ?? '—'} • Уақыты:{' '}
                {activeOffer.request?.departureType ?? '—'}
              </Text>
              <Text style={{ color: theme.colors.mutedText }}>
                Жолаушы: {activeOffer.request?.passenger?.displayName ?? activeOffer.request?.passenger?.firstName ?? '—'}
              </Text>
              <View style={styles.offerRow}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAcceptOffer}
                >
                  <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Қабылдау</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
                  onPress={handleRejectOffer}
                >
                  <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Бас тарту</Text>
                </TouchableOpacity>
              </View>
              {activeOffer.request?.passenger?.phone ? (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  onPress={() => Linking.openURL(`tel:${activeOffer.request?.passenger?.phone}`)}
                >
                  <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>
                    Қоңырау шалу
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={{ marginTop: 12, gap: 10 }}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Келесі жолаушы</Text>
            {nextPassenger ? (
              <QueueNextCard
                passenger={nextPassenger}
                onConfirm={() => handleConfirmPassenger(nextPassenger.id)}
                onSkip={() => handleSkipPassenger(nextPassenger.id)}
              />
            ) : (
              <EmptyQueueState />
            )}
            {nextPassengers.length ? <QueueCarousel passengers={nextPassengers} /> : null}
            {confirmedPassengers.length ? (
              <QueueCarousel
                passengers={confirmedPassengers}
                onRemove={handleRemoveConfirmed}
                title="Расталғандар"
              />
            ) : null}
          </View>
        </View>
      )}

      <MapPicker
        visible={showMapPicker}
        title="Ауыл орнын таңдаңыз"
        initialLat={locationCoords?.lat}
        initialLng={locationCoords?.lng}
        onPick={(coords) => handleAddVillage(coords)}
        onClose={() => setShowMapPicker(false)}
      />
      <MapPicker
        visible={showDestPicker && !!destHubName.trim()}
        title={`"${destHubName}" нүктесін таңдаңыз`}
        initialLat={locationCoords?.lat}
        initialLng={locationCoords?.lng}
        onPick={(coords) => handleAddDestination(coords)}
        onClose={() => setShowDestPicker(false)}
      />
      <Modal visible={mode === 'passenger' && passengerStep !== 'P0'} transparent={false} animationType="slide">
        <View style={[styles.flowScreen, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={styles.flowContent}>
            {passengerStep === 'P1' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Растау</Text>
                <Text style={{ color: theme.colors.text }}>Бағыт: {passengerRouteFrom} → {passengerRouteTo}</Text>
                <Text style={{ color: theme.colors.text }}>Кездесу орны: {passengerPickup || '—'}</Text>
                <Text style={{ color: theme.colors.text }}>Адам: {passengerSeats || '—'}</Text>
                <Text style={{ color: theme.colors.text }}>Жүк: {passengerCargo || 'NONE'}</Text>
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={handleCreateRequest}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>✅ Растаймын</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }]}
                    onPress={() => setShowPassengerConfirm(false)}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>↩️ Өзгертем</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {passengerStep === 'P2' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Күту</Text>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ color: theme.colors.mutedText, marginTop: 8 }}>
                  Кезектен жүргізуші шақырылып жатыр…
                </Text>
                <Text style={{ color: theme.colors.mutedText }}>
                  {passengerRequest?.status === 'OFFER_SENT'
                    ? 'Жүргізуші жауап беріп жатыр (60 сек)'
                    : 'Жүргізуші ізделуде'}
                </Text>
                <View style={{ marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
                    onPress={handleCancelRequestConfirm}
                  >
                    <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>❌ Бас тарту</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {passengerStep === 'P3' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>ҚАБЫЛДАНДЫ ✅</Text>
                <Text style={{ color: theme.colors.text, marginTop: 6 }}>
                  {passengerRouteFrom} → {passengerRouteTo}
                </Text>
                <Text style={{ color: theme.colors.text }}>
                  Жүргізуші: {passengerRequest?.assignedDriver?.displayName ?? '—'}
                </Text>
                <Text style={{ color: theme.colors.text }}>
                  Бос орын: {assignedQueue ? `${assignedQueue.availableSeats}/${assignedQueue.capacity}` : '—'}
                </Text>
                <Text style={{ color: theme.colors.text }}>
                  Кездесу орны: {passengerPickup || '—'}
                </Text>
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: theme.colors.mutedText }}>🟡 Жүргізуші әлі шыққан жоқ</Text>
                </View>
                <View style={{ marginTop: 12, gap: 8 }}>
                  {passengerRequest?.assignedDriver?.phone ? (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: theme.colors.primary }]}
                      onPress={() => Linking.openURL(`tel:${passengerRequest?.assignedDriver?.phone}`)}
                    >
                      <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>📞 Қоңырау шалу</Text>
                    </TouchableOpacity>
                  ) : null}
                  <Text style={{ color: theme.colors.mutedText }}>
                    Жүргізушіге қазір қоңырау шалуға болады.
                  </Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
                    onPress={handleCancelRequestConfirm}
                  >
                    <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>❌ Бас тарту</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {passengerStep === 'P4' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>🔵 Жүргізуші сізге келе жатыр</Text>
                <Text style={{ color: theme.colors.mutedText, marginTop: 6 }}>
                  Шамамен жету уақыты: 5–10 мин
                </Text>
                <Text style={{ color: theme.colors.text, marginTop: 10 }}>
                  {passengerRouteFrom} → {passengerRouteTo}
                </Text>
                <Text style={{ color: theme.colors.text }}>
                  Кездесу орны: {passengerPickup || '—'}
                </Text>
                <View style={{ marginTop: 12, gap: 8 }}>
                  {passengerRequest?.assignedDriver?.phone ? (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: theme.colors.primary }]}
                      onPress={() => Linking.openURL(`tel:${passengerRequest?.assignedDriver?.phone}`)}
                    >
                      <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>📞 Қоңырау</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
                    onPress={handleCancelRequestConfirm}
                  >
                    <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>❌ Бас тарту</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {passengerStep === 'P5' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>🟢 Жүргізуші келді</Text>
                <Text style={{ color: theme.colors.text, marginTop: 6 }}>Көлікке отырыңыз</Text>
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={handlePassengerPickedUp}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>✅ Отырдым</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {passengerStep === 'P6' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>🔵 Жолға шықтық</Text>
                <Text style={{ color: theme.colors.text, marginTop: 6 }}>
                  Бағыт: {passengerRouteFrom} → {passengerRouteTo}
                </Text>
              </View>
            ) : null}
            {passengerStep === 'P7' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>🟢 Сапар аяқталды</Text>
                <Text style={{ color: theme.colors.mutedText }}>Рахмет!</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={mode === 'driver' && driverStep !== 'D0'} transparent={false} animationType="slide">
        <View style={[styles.flowScreen, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={styles.flowContent}>
            {driverStep === 'D1' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Кезекте</Text>
                <Text style={{ color: theme.colors.text }}>
                  Бағыт: {driverRouteFrom} → {driverRouteTo}
                </Text>
                <Text style={{ color: theme.colors.mutedText }}>
                  Бос орын: {queueStatus?.availableSeats ?? '—'} • Кезекте: {passengerCount}
                </Text>
              </View>
            ) : null}
            {driverStep === 'D2' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Тапсырыс түсті</Text>
                <Text style={{ color: theme.colors.text }}>
                  Бағыт: {activeOffer?.route.fromHub?.name ?? '—'} → {activeOffer?.route.toHub?.name ?? '—'}
                </Text>
                <Text style={{ color: theme.colors.mutedText }}>
                  Кездесу: {activeOffer?.request?.pickupText ?? '—'}
                </Text>
                <Text style={{ color: theme.colors.mutedText }}>
                  Адам: {activeOffer?.request?.seats ?? 1} • Жүк: {activeOffer?.request?.cargoType ?? 'NONE'}
                </Text>
                {offerCountdownLabel ? (
                  <Text style={{ color: theme.colors.mutedText }}>Қалған уақыт: {offerCountdownLabel}</Text>
                ) : null}
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={handleAcceptOffer}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>✅ Қабылдаймын</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
                    onPress={handleRejectOffer}
                  >
                    <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>❌ Өткізем</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {driverStep === 'D3' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Сен қабылдадың</Text>
                <Text style={{ color: theme.colors.text }}>Кездесу орны: {driverActiveRequest?.pickupText ?? '—'}</Text>
                <Text style={{ color: theme.colors.mutedText }}>
                  Жолаушы: {driverActiveRequest?.passenger?.displayName ?? '—'}
                </Text>
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={() => driverActiveRequest?.id && handleDriverOnTheWay(driverActiveRequest.id)}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>✅ Шықтым</Text>
                  </TouchableOpacity>
                  {driverActiveRequest?.passenger?.phone ? (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: theme.colors.primary }]}
                      onPress={() => Linking.openURL(`tel:${driverActiveRequest?.passenger?.phone}`)}
                    >
                      <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>📞 Қоңырау</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}
            {driverStep === 'D4' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Жолда</Text>
                <Text style={{ color: theme.colors.text }}>Кездесу орны: {driverActiveRequest?.pickupText ?? '—'}</Text>
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={() => driverActiveRequest?.id && handleDriverPickedUp(driverActiveRequest.id)}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>✅ Отырды</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {driverStep === 'D5' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Жолаушы отырды</Text>
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.colors.primary }]}
                    onPress={() => driverActiveRequest?.id && handleDriverComplete(driverActiveRequest.id)}
                  >
                    <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>✅ Жетті</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
            {driverStep === 'D6' ? (
              <View style={[styles.flowCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.flowTitle, { color: theme.colors.text }]}>Сапар аяқталды</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={showOnTheWayPrompt} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>
              Жолға шықтың ба?
            </Text>
            <Text style={{ color: theme.colors.mutedText, marginTop: 6 }}>
              15 минут өтті. Егер шықсаңыз, “Жүрдім” басыңыз.
            </Text>
            <View style={{ marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.primary }]}
                onPress={handleQueueOnTheWay}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Жүрдім</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border }]}
                onPress={() => setShowOnTheWayPrompt(false)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Кейін</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {snackbar ? (
        <View style={[styles.snackbar, { backgroundColor: theme.colors.text }]}>
          <Text style={{ color: theme.colors.surface }}>{snackbar}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

export default function TaxiEntry() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.entryCard, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.entryTitle, { color: theme.colors.text }]}>Такси</Text>
        <Text style={styles.entryHelper}>
          Алдымен бағыт таңдайсың → кезекті көресің → сосын ғана тапсырыс/кезек.
        </Text>
      </View>
      <View style={[styles.entryCard, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.entrySectionTitle, { color: theme.colors.text }]}>Жолаушы</Text>
        <TouchableOpacity
          style={[styles.entryPrimaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/taxi/passenger')}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.surface }]}>Жолаушы беті</Text>
        </TouchableOpacity>
        <Text style={styles.entryHelper}>
          Кезекті көріп, такси болса ғана тапсырыс бересің.
        </Text>
      </View>
      <View style={[styles.entryCard, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.entrySectionTitle, { color: theme.colors.text }]}>Жүргізуші</Text>
        <TouchableOpacity
          style={[
            styles.entryOutlineButton,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
          ]}
          onPress={() => router.push('/taxi/driver')}
        >
          <Text style={[styles.primaryButtonText, { color: theme.colors.text }]}>Жүргізуші беті</Text>
        </TouchableOpacity>
        <Text style={styles.entryHelper}>
          Кезекті көріп, ең соңына өзің тұрасың.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  bottomSheet: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    gap: 12,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  routeOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 52,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  offerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  queueFloating: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: -10,
    gap: 8,
  },
  queueMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  focusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  mapOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
  },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  flowScreen: {
    flex: 1,
  },
  flowContent: {
    padding: 16,
    gap: 16,
  },
  flowCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  flowTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  entryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  entrySectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  entryHelper: {
    fontSize: 13,
    color: '#6B7280',
  },
  entryPrimaryButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  entryOutlineButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
