import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api/client';
import { useTheme } from '@/src/mobile/theme';

type Hub = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type TaxiRoute = {
  id: string;
  fromHub?: Hub;
  toHub?: Hub;
};

type CommunityVillage = {
  id: string;
  nameDisplay: string;
  lat: number;
  lng: number;
};

const ROUTES_CACHE_KEY = 'taxi_routes_cache';
const LAST_ORIGIN_KEY = 'taxi_last_origin_id';

export default function PassengerTaxiRouteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const normalizeHub = (hub: any): CommunityVillage => ({
    id: hub.id,
    nameDisplay: hub.nameDisplay ?? hub.name ?? 'Белгісіз',
    lat: hub.lat,
    lng: hub.lng,
  });

  const [currentVillage, setCurrentVillage] = useState<CommunityVillage | null>(null);
  const [routes, setRoutes] = useState<TaxiRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<CommunityVillage | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesHint, setRoutesHint] = useState<string | null>(null);

  const loadRoutes = async (originId?: string) => {
    if (!originId) return;
    setRoutesLoading(true);
    try {
      const response = await api.get('/taxi/routes', {
        params: { origin: originId, mode: 'passenger', _ts: Date.now() },
      });
      const items = response.data ?? [];
      if (items.length) {
        setRoutes(items);
        setRoutesHint(null);
        await AsyncStorage.setItem(
          ROUTES_CACHE_KEY,
          JSON.stringify({ originId, items }),
        );
      } else {
        setRoutesHint('Бағыт табылмады. Соңғы сақталған маршруттар көрсетілді.');
        const cachedRaw = await AsyncStorage.getItem(ROUTES_CACHE_KEY);
        const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
        if (cached?.originId === originId && Array.isArray(cached.items)) {
          setRoutes(cached.items);
        } else {
          setRoutes([]);
        }
      }
      if (!items.length) {
        setSelectedRouteId(null);
      }
      await AsyncStorage.setItem(LAST_ORIGIN_KEY, originId);
    } catch (error) {
      console.log('[PassengerRoute] routes failed', error);
      setRoutesHint('Бағыт жүктелмеді. Соңғы сақталған маршруттар көрсетілді.');
      const cachedRaw = await AsyncStorage.getItem(ROUTES_CACHE_KEY);
      const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
      if (cached?.originId === originId && Array.isArray(cached.items)) {
        setRoutes(cached.items);
      } else {
        setRoutes([]);
      }
    } finally {
      setRoutesLoading(false);
    }
  };

  const loadCurrentVillage = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        const cachedOrigin = await AsyncStorage.getItem(LAST_ORIGIN_KEY);
        if (cachedOrigin) {
          await loadRoutes(cachedOrigin);
        }
        return;
      }
      let position = await Location.getLastKnownPositionAsync({});
      if (!position) {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setLocationCoords({ lat, lng });
      const response = await api.get('/presence/resolve-hub', { params: { lat, lng } });
      const { confidence, hubId, nearby } = response.data;
      if (confidence === 'HIGH' && hubId) {
        const hub = (nearby || []).find((h: any) => h.id === hubId);
        if (hub) {
          const normalized = normalizeHub(hub);
          setCurrentVillage(normalized);
          await loadRoutes(normalized.id);
          return;
        }
      }
      if ((nearby || []).length > 0) {
        const fallback = normalizeHub(nearby[0]);
        setCurrentVillage(fallback);
        await loadRoutes(fallback.id);
        return;
      }
      const cachedOrigin = await AsyncStorage.getItem(LAST_ORIGIN_KEY);
      if (cachedOrigin) {
        await loadRoutes(cachedOrigin);
      }
    } catch (error) {
      console.log('[PassengerRoute] resolve hub failed', error);
    }
  };

  useEffect(() => {
    loadCurrentVillage();
  }, []);

  useEffect(() => {
    if (!selectedRouteId) return;
    const route = routes.find((r) => r.id === selectedRouteId);
    if (route?.toHub) {
      setSelectedDestination(normalizeHub(route.toHub));
    }
  }, [selectedRouteId, routes]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Math.max(16, insets.top + 12), paddingBottom: Math.max(24, insets.bottom + 12) },
      ]}
    >
      <View style={styles.headerBlock}>
        <View style={styles.topBar}>
          <View style={styles.sideSlot}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
          <Text style={styles.topTitle}>Ауыл таксисі</Text>
          <View style={[styles.sideSlot, styles.sideSlotRight]}>
            <TouchableOpacity
              style={[
                styles.topAction,
                { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.border },
              ]}
              onPress={() => router.push('/taxi/driver')}
            >
              <Text style={[styles.topActionText, { color: theme.colors.text }]} numberOfLines={1}>
                Жүргізуші болу
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.contentBlock}>
        <Text style={styles.headline}>
          <Text style={[styles.headline, { color: theme.colors.primary }]}>
            {(currentVillage?.nameDisplay ?? 'ТЕРЕКТІ').toUpperCase()}
          </Text>
          {' → ҚАЙДА БАРАМЫЗ?'}
        </Text>
        {routesLoading ? (
          <Text style={[styles.hintText, { color: theme.colors.mutedText }]}>Бағыттар жүктелуде...</Text>
        ) : routesHint ? (
          <Text style={[styles.hintText, { color: theme.colors.mutedText }]}>{routesHint}</Text>
        ) : null}
        <View style={styles.optionRow}>
          {routes.map((route) => {
            const dest = route.toHub;
            if (!dest) return null;
            const active = selectedRouteId === route.id;
            return (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: active ? theme.colors.primary : '#FFFFFF',
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => {
                  setSelectedRouteId(route.id);
                  router.push({ pathname: '/taxi/passenger/trips', params: { routeId: route.id } });
                }}
              >
                <Text style={{ color: active ? '#FFFFFF' : theme.colors.primary, fontWeight: '700' }}>
                  {dest.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: 20,
    marginTop: 74,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  sideSlot: {
    width: 140,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideSlotRight: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  topAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  topActionText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  headline: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
  },
  optionButton: {
    height: 44,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
