import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, ToastAndroid } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/lib/api/client';
import { useTheme } from '@/src/mobile/theme';
import MapPicker from '@/src/mobile/components/MapPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function DriverTaxiRouteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const normalizeHub = (hub: any): CommunityVillage => ({
    id: hub.id,
    nameDisplay: hub.nameDisplay ?? hub.name ?? 'Белгісіз',
    lat: hub.lat,
    lng: hub.lng,
  });
  const normalizeName = (value: string) => value.trim().toLowerCase();

  const [currentVillage, setCurrentVillage] = useState<CommunityVillage | null>(null);
  const [routes, setRoutes] = useState<TaxiRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<CommunityVillage | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destHubName, setDestHubName] = useState('');
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [showDestActions, setShowDestActions] = useState(false);
  const [showDestNameModal, setShowDestNameModal] = useState(false);
  const destInputRef = useRef<TextInput>(null);

  const [openingTrip, setOpeningTrip] = useState(false);

  const checkActiveTrip = useCallback(async () => {
    try {
      const res = await api.get('/me/active');
      const session = res.data?.activeTripSession;
      if (session?.id) {
        router.replace(`/trips/driver/${session.id}`);
        return;
      }
      const activeRouteId = await AsyncStorage.getItem('driver_queue_active_route');
      if (!activeRouteId) return;
      const response = await api.get('/drivers/queue/status', { params: { routeId: activeRouteId } });
      if (response.data?.queue) {
        router.replace({ pathname: '/taxi/driver/active', params: { routeId: activeRouteId } });
        return;
      }
      await AsyncStorage.removeItem('driver_queue_active_route');
    } catch (error) {
      console.log('[DriverRoute] active check failed', error);
    }
  }, [router]);

  const handleOpenTrip = useCallback(async () => {
    if (!selectedRouteId) return;
    setOpeningTrip(true);
    try {
      const res = await api.post('/trips/open', { routeId: selectedRouteId, totalSeats: 4 });
      const tripId = res.data?.id;
      if (tripId) {
        router.replace(`/trips/driver/${tripId}`);
      }
    } catch (e: any) {
      Alert.alert('Қате', e?.response?.data?.message ?? 'Рейс ашу мүмкін болмады');
    } finally {
      setOpeningTrip(false);
    }
  }, [selectedRouteId, router]);

  useFocusEffect(
    useCallback(() => {
      checkActiveTrip();
    }, [checkActiveTrip]),
  );

  const loadRoutes = async (originId?: string) => {
    if (!originId) return;
    try {
      const response = await api.get('/taxi/routes', {
        params: { origin: originId, mode: 'driver', _ts: Date.now() },
      });
      const items = response.data ?? [];
      setRoutes(items);
      if (!items.length) {
        setSelectedRouteId(null);
      }
    } catch (error) {
      console.log('[DriverRoute] routes failed', error);
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
      }
    } catch (error) {
      console.log('[DriverRoute] resolve hub failed', error);
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

  const mapRegion = useMemo(() => {
    const lat = currentVillage?.lat ?? locationCoords?.lat ?? 43.238949;
    const lng = currentVillage?.lng ?? locationCoords?.lng ?? 76.889709;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [currentVillage?.lat, currentVillage?.lng, locationCoords?.lat, locationCoords?.lng]);

  const handleSelectRoute = async (route: TaxiRoute) => {
    setSelectedRouteId(route.id);
    router.push({ pathname: '/taxi/driver/queue', params: { routeId: route.id } });
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

        const routeRes = await api.post('/taxi/routes/ensure', {
          originHubId: currentVillage.id,
          destHubId: hubB.id,
        });
        const createdRoute = routeRes.data;
        if (createdRoute?.id) {
          setSelectedRouteId(createdRoute.id);
          if (createdRoute?.toHub) {
            setSelectedDestination(normalizeHub(createdRoute.toHub));
          }
          setRoutes((prev) =>
            prev.some((item) => item.id === createdRoute.id) ? prev : [createdRoute, ...prev],
          );
        }
        setShowDestPicker(false);
        setDestHubName('');
        await loadRoutes(currentVillage.id);

        if (Platform.OS === 'android') {
          ToastAndroid.show('Бағыт қосылды', ToastAndroid.SHORT);
        } else {
          Alert.alert('Сәтті', 'Бағыт қосылды');
        }
      } catch (error: any) {
        const message = error?.response?.data?.message ?? '';
        if (message.includes('радиуста хаб бар')) {
          try {
            const nearbyRes = await api.get('/hubs/nearby', {
              params: { lat: coords.lat, lng: coords.lng, radius: 5000 },
            });
            const nearbyHubs = (nearbyRes.data ?? []).map((hub: any) => normalizeHub(hub));
            const match = nearbyHubs.find(
              (hub) => normalizeName(hub.nameDisplay) === normalizeName(destHubName),
            ) ?? nearbyHubs[0];
            if (!match) {
              Alert.alert('Қате', 'Жақын хаб табылмады');
              return;
            }
            const routeRes = await api.post('/taxi/routes/ensure', {
              originHubId: currentVillage.id,
              destHubId: match.id,
            });
            const createdRoute = routeRes.data;
            if (createdRoute?.id) {
              setSelectedRouteId(createdRoute.id);
              if (createdRoute?.toHub) {
                setSelectedDestination(normalizeHub(createdRoute.toHub));
              } else {
                setSelectedDestination(match);
              }
              setRoutes((prev) =>
                prev.some((item) => item.id === createdRoute.id) ? prev : [createdRoute, ...prev],
              );
            }
            setShowDestPicker(false);
            setDestHubName('');
            await loadRoutes(currentVillage.id);
            if (Platform.OS === 'android') {
              ToastAndroid.show('Бағыт қосылды', ToastAndroid.SHORT);
            } else {
              Alert.alert('Сәтті', 'Бағыт қосылды');
            }
            return;
          } catch (fallbackError) {
            console.log('[DriverRoute] nearby fallback failed', fallbackError);
          }
        }
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
    const target = hub ?? selectedDestination;
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Жүргізуші</Text>
        {currentVillage ? (
          <Text style={styles.helperText}>Бастапқы: {currentVillage.nameDisplay}</Text>
        ) : null}
      </View>
      <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Бағыт таңдау</Text>
        {currentVillage ? (
          <View style={{ gap: 8 }}>
            {MapView && UrlTile && Marker && Polyline ? (
              <View style={{ height: 110, borderRadius: 16, overflow: 'hidden' }}>
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
                    {currentVillage.nameDisplay}
                    {selectedDestination?.nameDisplay ? ` → ${selectedDestination.nameDisplay}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Қайда барамыз?</Text>
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
                        backgroundColor: active ? '#DCFCE7' : '#F3F4F6',
                        borderColor: active ? '#22C55E' : '#E5E7EB',
                      },
                    ]}
                    onPress={() => handleSelectRoute(route)}
                    onLongPress={() => {
                      setSelectedDestination(normalizeHub(dest));
                      setShowDestActions(true);
                    }}
                  >
                    <Text style={{ color: active ? '#166534' : '#374151' }}>
                      {active ? `✓ ${dest.name}` : dest.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.optionButton, { borderStyle: 'dashed', borderColor: theme.colors.primary }]}
                onPress={() => {
                  setShowDestNameModal(true);
                }}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>+ БАРАТЫН НҮКТЕ</Text>
              </TouchableOpacity>
            </View>
            {currentVillage && selectedDestination ? (
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                {currentVillage.nameDisplay} → {selectedDestination.nameDisplay}
              </Text>
            ) : null}
            {showDestActions && selectedDestination ? (
              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: theme.colors.border }]}
                onPress={() => handleRequestHubRemoval(selectedDestination)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>🗑 Жою</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.helperText}>Бағыт таңдадың → рейс ашып, жолаушылар қосылады.</Text>
            {selectedRouteId && (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                    marginTop: 12,
                    paddingVertical: 14,
                    alignSelf: 'stretch',
                    alignItems: 'center',
                  },
                ]}
                onPress={handleOpenTrip}
                disabled={openingTrip}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {openingTrip ? 'Рейс ашылуда...' : 'Рейс ашу'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <Text style={styles.helperText}>Хаб анықталмады.</Text>
        )}
      </View>
      <MapPicker
        visible={showDestPicker && !!destHubName.trim()}
        title={`"${destHubName}" нүктесін таңдаңыз`}
        initialLat={locationCoords?.lat}
        initialLng={locationCoords?.lng}
        onPick={(coords) => handleAddDestination(coords)}
        onClose={() => setShowDestPicker(false)}
      />
      <Modal visible={showDestNameModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>Баратын нүкте</Text>
            <Text style={{ color: theme.colors.mutedText, marginTop: 6 }}>
              Алдымен баратын нүктенің атын жазыңыз.
            </Text>
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, marginTop: 12 }]}
              placeholder="Баратын нүкте атауы (мыс: Алматы)"
              placeholderTextColor={theme.colors.placeholder}
              value={destHubName}
              onChangeText={setDestHubName}
              ref={destInputRef}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!destHubName.trim()) return;
                setShowDestNameModal(false);
                setShowDestPicker(true);
              }}
            />
            <View style={{ marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: theme.colors.border, alignSelf: 'stretch' }]}
                onPress={() => setShowDestNameModal(false)}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600', textAlign: 'center' }}>Жабу</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { borderColor: theme.colors.primary, alignSelf: 'stretch', backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  if (!destHubName.trim()) {
                    Alert.alert('Қате', 'Баратын нүкте атауын енгізіңіз');
                    return;
                  }
                  setShowDestNameModal(false);
                  setShowDestPicker(true);
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', textAlign: 'center' }}>Картадан таңдау</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    height: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  outlineButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
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
  mapOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
