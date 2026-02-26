import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/mobile/theme';
import { GeocodingResult, geocodingProvider } from '@/lib/geocoding';
import { routingProvider, RouteResult } from '@/lib/routing';
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';

const mapsModule = Platform.OS === 'web' ? null : require('react-native-maps');
const MapView = mapsModule ? mapsModule.default : null;
const Marker = mapsModule ? mapsModule.Marker : null;
const Polygon = mapsModule ? mapsModule.Polygon : null;
const Polyline = mapsModule ? mapsModule.Polyline : null;
const Callout = mapsModule ? mapsModule.Callout : null;
const PROVIDER_GOOGLE = mapsModule ? mapsModule.PROVIDER_GOOGLE : null;

type FieldPolygon = {
  id: string;
  number: number;
  crop: string;
  owner: string;
  areaHa: number;
  coords: { latitude: number; longitude: number }[];
};

type Facility = {
  id: string;
  type: 'ELEVATOR' | 'WAREHOUSE' | 'LIVESTOCK' | 'FACTORY' | 'MARKET' | 'LOGISTICS';
  name: string;
  status: string;
  coordinate: { latitude: number; longitude: number };
};

type DriverMarker = {
  id: string;
  displayName?: string | null;
  driverType?: string | null;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt?: string | null;
};

type CommunityVillage = {
  id: string;
  nameDisplay: string;
  lat: number;
  lng: number;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
};

type SelectedLocation = {
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  source: 'mapTap' | 'search' | 'savedPoi';
  confirmCount?: number;
  streetCount?: number;
};

const facilityIcon: Record<Facility['type'], string> = {
  ELEVATOR: 'business',
  WAREHOUSE: 'cube',
  LIVESTOCK: 'paw',
  FACTORY: 'construct',
  MARKET: 'storefront',
  LOGISTICS: 'trail-sign',
};

const toRad = (value: number) => (value * Math.PI) / 180;

const haversineKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const polygonAreaHa = (coords: { latitude: number; longitude: number }[]) => {
  if (coords.length < 3) return 0;
  const R = 6378137;
  const lat0 = toRad(coords[0].latitude);
  const points = coords.map((p) => {
    const x = R * toRad(p.longitude) * Math.cos(lat0);
    const y = R * toRad(p.latitude);
    return { x, y };
  });
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area / 2) / 10000;
};

const parseStreetHouse = (query: string) => {
  const match = query.match(/^(.*?)(\d+)\s*$/);
  if (!match) return { street: query.trim(), houseNumber: undefined };
  return { street: match[1].trim(), houseNumber: match[2] };
};

export default function AgroMapScreen() {
  const { theme } = useTheme();
  const { deliveryId } = useLocalSearchParams<{ deliveryId?: string }>();
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState({
    latitude: 43.238949,
    longitude: 76.889709,
    latitudeDelta: 0.25,
    longitudeDelta: 0.25,
  });
  const [showFields, setShowFields] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showDelivery, setShowDelivery] = useState(true);
  const [showTaxi, setShowTaxi] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    (GeocodingResult & { sourceType?: 'addressPoint'; confirmCount?: number; streetCount?: number })[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [draftPoints, setDraftPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [fields, setFields] = useState<FieldPolygon[]>([
    {
      id: 'field-12',
      number: 12,
      crop: 'Бидай',
      owner: 'Ұлағат',
      areaHa: 48,
      coords: [
        { latitude: 43.254, longitude: 76.78 },
        { latitude: 43.258, longitude: 76.795 },
        { latitude: 43.247, longitude: 76.802 },
        { latitude: 43.242, longitude: 76.789 },
      ],
    },
  ]);
  const [facilities] = useState<Facility[]>([
    {
      id: 'fac-1',
      type: 'ELEVATOR',
      name: 'Алтын Дән Элеваторы',
      status: 'Ашық',
      coordinate: { latitude: 43.25, longitude: 76.91 },
    },
    {
      id: 'fac-2',
      type: 'MARKET',
      name: 'Фермер базары',
      status: 'Күн сайын 9:00-18:00',
      coordinate: { latitude: 43.23, longitude: 76.88 },
    },
    {
      id: 'fac-3',
      type: 'LOGISTICS',
      name: 'Tasymal бекеті',
      status: 'Қол жетімді',
      coordinate: { latitude: 43.27, longitude: 76.84 },
    },
  ]);
  const [routeStart, setRouteStart] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeEnd, setRouteEnd] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('hybrid');
  const [contributeMode, setContributeMode] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [driverMarkers, setDriverMarkers] = useState<DriverMarker[]>([]);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [villages, setVillages] = useState<CommunityVillage[]>([]);
  const [villagesError, setVillagesError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const googleMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
  const isApiKeyMissing = !googleMapsApiKey;
  const isExpoGo = Constants.appOwnership === 'expo';
  const useGoogleProvider = !(__DEV__ && isExpoGo) && !isApiKeyMissing;

  useEffect(() => {
    if (isApiKeyMissing) {
      console.warn('[ENV] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is missing. Check qunarly-mobile/.env');
    }
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      const nextRegion = {
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setRegion(nextRegion);
      if (mapRef.current?.animateToRegion) {
        mapRef.current.animateToRegion(nextRegion, 500);
      }
    })();
  }, []);

  useEffect(() => {
    getSession().then((session) => {
      setUserRole(session.role);
    });
  }, []);

  useEffect(() => {
    if (userRole !== 'CARRIER') return;
    let mounted = true;
    const tick = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({});
        if (!mounted) return;
        await api.post('/drivers/location', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
        });
      } catch (error) {
        console.log('[Driver Location]', error);
      }
    };
    tick();
    const interval = setInterval(tick, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [userRole]);

  const refreshDrivers = useCallback(async () => {
    if (!deliveryId || typeof deliveryId !== 'string') {
      return;
    }
    try {
      setDriverError(null);
      const response = await api.get(`/deliveries/${deliveryId}/drivers`);
      setDriverMarkers(response.data ?? []);
    } catch (error) {
      console.log('[Drivers Error]', error);
      setDriverError('Жеткізушілерді жүктеу мүмкін болмады');
    }
  }, [deliveryId]);

  useEffect(() => {
    if (!deliveryId || typeof deliveryId !== 'string') {
      setDriverMarkers([]);
      return;
    }
    refreshDrivers();
    const interval = setInterval(refreshDrivers, 12000);
    return () => clearInterval(interval);
  }, [deliveryId, refreshDrivers]);

  const fetchAddressPoints = useCallback(async (query: string, lat: number, lng: number) => {
    const response = await api.get('/address-points/search', {
      params: { q: query, lat, lng, radiusKm: 5 },
    });
    return (response.data ?? []).map((item: any) => ({
      id: `ap-${item.id}`,
      title: [item.street, item.houseNumber].filter(Boolean).join(' ') || 'Үй орны',
      subtitle: item.locality || 'Халықтық мекенжай',
      lat: item.lat,
      lng: item.lng,
      sourceType: 'addressPoint' as const,
      confirmCount: item.confirmCount,
      streetCount: item.streetCount,
    }));
  }, []);

  const saveAddressPoint = useCallback(async () => {
    if (!pendingPoint) return;
    const { street, houseNumber } = parseStreetHouse(searchQuery);
    try {
      await api.post('/address-points', {
        lat: pendingPoint.lat,
        lng: pendingPoint.lng,
        street: street || undefined,
        houseNumber,
        locality: selectedLocation?.subtitle || undefined,
      });
      Alert.alert('Сақталды', 'Рақмет! Бұл мекенжай болашақта көрсетіледі.');
      setContributeMode(false);
      setPendingPoint(null);
    } catch {
      Alert.alert('Қате', 'Мекенжайды сақтау мүмкін болмады.');
    }
  }, [pendingPoint, searchQuery, selectedLocation]);

  const openExternalNavigation = useCallback(async () => {
    const destination = routeEnd ?? (selectedLocation ? { latitude: selectedLocation.lat, longitude: selectedLocation.lng } : null);
    const origin = routeStart ?? (userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null);
    if (!destination) {
      Alert.alert('Маршрут', 'Алдымен жеткізу нүктесін таңдаңыз.');
      return;
    }
    if (!origin) {
      Alert.alert('Маршрут', 'Ағымдағы локация табылмады. GPS-ті қосыңыз.');
      return;
    }
    const originParam = `${origin.latitude},${origin.longitude}`;
    const destinationParam = `${destination.latitude},${destination.longitude}`;
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?saddr=${originParam}&daddr=${destinationParam}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}&travelmode=driving`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('[Navigation Error]', error);
      Alert.alert('Қате', 'Навигацияны ашу мүмкін болмады.');
    }
  }, [routeEnd, routeStart, selectedLocation, userLocation]);

  const onMapPress = useCallback(
    (event: any) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      if (drawMode) {
        setDraftPoints((prev) => [...prev, { latitude, longitude }]);
        return;
      }
      if (contributeMode) {
        setPendingPoint({ lat: latitude, lng: longitude });
        setSelectedLocation({
          lat: latitude,
          lng: longitude,
          title: 'Үй орны белгіленді',
          subtitle: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          source: 'savedPoi',
        });
        return;
      }
      setSelectedLocation({
        lat: latitude,
        lng: longitude,
        title: 'Картадан таңдалды',
        subtitle: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        source: 'mapTap',
      });
      if (!routeStart) {
        setRouteStart({ latitude, longitude });
        return;
      }
      if (!routeEnd) {
        setRouteEnd({ latitude, longitude });
      }
    },
    [contributeMode, drawMode, routeEnd, routeStart],
  );

  const finishField = () => {
    if (draftPoints.length < 3) {
      Alert.alert('Қате', 'Алқап кемінде 3 нүктеден тұруы керек.');
      return;
    }
    const areaHa = Number(polygonAreaHa(draftPoints).toFixed(1));
    const nextNumber = fields.length + 1;
    const newField: FieldPolygon = {
      id: `field-${nextNumber}`,
      number: nextNumber,
      crop: 'Бидай',
      owner: 'Мен',
      areaHa,
      coords: draftPoints,
    };
    setFields((prev) => [newField, ...prev]);
    setDraftPoints([]);
    setDrawMode(false);
  };

  const routeDistance = routeData?.distanceKm ?? null;
  const etaMinutes = routeData?.durationMin ?? null;
  const isNavigationMode = Boolean(routeData);

  const onRegionChangeComplete = useCallback((nextRegion: typeof region) => {
    setRegion(nextRegion);
  }, []);

  const loadVillages = useCallback(async (nextRegion: typeof region) => {
    const west = nextRegion.longitude - nextRegion.longitudeDelta / 2;
    const east = nextRegion.longitude + nextRegion.longitudeDelta / 2;
    const south = nextRegion.latitude - nextRegion.latitudeDelta / 2;
    const north = nextRegion.latitude + nextRegion.latitudeDelta / 2;
    try {
      const response = await api.get('/community-villages', {
        params: { bbox: `${west},${south},${east},${north}` },
      });
      setVillages(response.data ?? []);
      setVillagesError(null);
    } catch (error) {
      console.log('[Villages] load failed', error);
      setVillagesError('Ауылдар тізімі жүктелмеді');
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      loadVillages(region);
    }, 400);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta, loadVillages]);

  useEffect(() => {
    if (!searchMode) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchHint(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      const viewbox: [number, number, number, number] = [
        region.longitude - region.longitudeDelta / 2,
        region.latitude - region.latitudeDelta / 2,
        region.longitude + region.longitudeDelta / 2,
        region.latitude + region.latitudeDelta / 2,
      ];
      let results: GeocodingResult[] = [];
      let addressPoints: typeof results = [];
      try {
        results = await geocodingProvider.search(searchQuery, { viewbox });
      } catch (error) {
        console.log('[Search Error] Google Places', error);
        Alert.alert('Қате', 'Google іздеуінде қате шықты. Кейін қайталап көріңіз.');
        setSearchError('Google іздеуінде қате шықты.');
      }
      try {
        addressPoints = await fetchAddressPoints(searchQuery, region.latitude, region.longitude);
      } catch (error) {
        console.log('[Search Error] Address points', error);
        Alert.alert('Қате', 'Мекенжай базасына қосылу мүмкін болмады.');
        setSearchError('Мекенжай базасына қосылу мүмкін болмады.');
      }
      const merged = [
        ...addressPoints,
        ...results,
      ];
      setSearchResults(merged);
      const hasHouse = results.some((item) => item.kind === 'house');
      setSearchHint(
        results.length > 0 && !hasHouse
          ? 'Үй нөмірлері бұл аймақта толық емес болуы мүмкін, картадан таңдаңыз.'
          : null,
      );
      setSearchLoading(false);
    }, 400);
  }, [searchMode, searchQuery, region]);

  useEffect(() => {
    if (!routeStart || !routeEnd) {
      setRouteData(null);
      return;
    }
    (async () => {
      const result = await routingProvider.route(routeStart, routeEnd);
      setRouteData(result);
    })();
  }, [routeEnd, routeStart]);

  const isDriverStale = (marker: DriverMarker) => {
    if (!marker.updatedAt) return true;
    const updated = new Date(marker.updatedAt).getTime();
    return Number.isNaN(updated) || Date.now() - updated > 30000;
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        map: {
          flex: 1,
        },
        overlay: {
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          gap: 8,
          pointerEvents: 'box-none',
        },
        searchBar: {
          backgroundColor: theme.colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 10,
          paddingHorizontal: 12,
        },
        warningBanner: {
          backgroundColor: '#FEF3C7',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#F59E0B',
          paddingVertical: 8,
          paddingHorizontal: 12,
        },
        warningText: {
          color: '#92400E',
          fontWeight: '600',
          fontSize: 12,
        },
        searchText: {
          color: theme.colors.placeholder,
          fontWeight: '600',
        },
        searchPanel: {
          backgroundColor: theme.colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 12,
          maxHeight: 320,
        },
        searchInput: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 10,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
        },
        searchActions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
        },
        searchActionText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        resultItem: {
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        resultTitle: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        resultSubtitle: {
          color: theme.colors.mutedText,
          fontSize: 12,
        },
        resultEmpty: {
          color: theme.colors.mutedText,
          textAlign: 'center',
          marginTop: 10,
        },
        chipRow: {
          flexDirection: 'row',
          gap: 8,
        },
        chip: {
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        chipActive: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        chipText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        chipTextActive: {
          color: theme.colors.surface,
        },
        controlPanel: {
          position: 'absolute',
          bottom: 16,
          left: 12,
          right: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          padding: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 8,
        },
        panelRow: {
          flexDirection: 'row',
          gap: 8,
        },
        panelButton: {
          flex: 1,
          borderRadius: 12,
          paddingVertical: 10,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        panelButtonPrimary: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        panelButtonText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        panelButtonTextPrimary: {
          color: theme.colors.surface,
        },
        infoText: {
          color: theme.colors.mutedText,
          fontSize: 12,
        },
        gpsButton: {
          position: 'absolute',
          right: 12,
          bottom: 120,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        mapTypeButton: {
          position: 'absolute',
          right: 12,
          bottom: 70,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        mapTypeButtonText: {
          color: theme.colors.text,
          fontWeight: '600',
          fontSize: 12,
        },
        contributeHint: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
          marginBottom: 10,
        },
        contributeHintText: {
          color: theme.colors.text,
          fontWeight: '600',
          textAlign: 'center',
        },
        bottomSheet: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 16,
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          padding: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 8,
        },
        sheetHandle: {
          alignSelf: 'center',
          width: 48,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.border,
          marginBottom: 6,
        },
        selectedCard: {
          position: 'absolute',
          bottom: 160,
          left: 12,
          right: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 6,
        },
        selectedTitle: {
          color: theme.colors.text,
          fontWeight: '700',
        },
        selectedSubtitle: {
          color: theme.colors.mutedText,
          fontSize: 12,
        },
        selectedActions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 6,
        },
        selectedButton: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
        selectedButtonText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        selectedButtonPrimary: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        selectedButtonTextPrimary: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        searchCta: {
          marginTop: 8,
          paddingVertical: 10,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: theme.colors.primary,
        },
        searchCtaText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        placeholder: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        },
        placeholderText: {
          color: theme.colors.mutedText,
        },
      }),
    [theme],
  );

  if (!MapView) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Карта бұл құрылғыда қолжетімсіз</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={onMapPress}
        provider={useGoogleProvider ? PROVIDER_GOOGLE : undefined}
        mapType={mapType}
        onMapReady={() =>
          console.log('[Map] ready', { provider: useGoogleProvider ? 'google' : 'default' })
        }
      >
        {showFields &&
          Polygon &&
          fields.map((field) => (
            <Polygon
              key={field.id}
              coordinates={field.coords}
              strokeColor="rgba(34,197,94,0.7)"
              fillColor="rgba(34,197,94,0.18)"
              tappable
              onPress={() =>
                Alert.alert(
                  `Алқап №${field.number}`,
                  `Өнім: ${field.crop}\nКөлемі: ${field.areaHa} га\nИесі: ${field.owner}`,
                )
              }
            />
          ))}
        {drawMode && Polygon && draftPoints.length >= 2 ? (
          <Polygon
            coordinates={draftPoints}
            strokeColor="rgba(59,130,246,0.8)"
            fillColor="rgba(59,130,246,0.15)"
          />
        ) : null}
        {showFacilities &&
          Marker &&
          facilities.map((facility) => (
            <Marker key={facility.id} coordinate={facility.coordinate}>
              <Ionicons name={facilityIcon[facility.type] as any} size={22} color={theme.colors.primary} />
              {Callout ? (
                <Callout>
                  <View style={{ padding: 6, maxWidth: 200 }}>
                    <Text style={{ fontWeight: '700' }}>{facility.name}</Text>
                    <Text style={{ fontSize: 12, marginTop: 4 }}>{facility.status}</Text>
                  </View>
                </Callout>
              ) : null}
            </Marker>
          ))}
        {Marker
          ? villages.map((village) => (
              <Marker
                key={`village-${village.id}`}
                coordinate={{ latitude: village.lat, longitude: village.lng }}
                pinColor="#22C55E"
              >
                {Callout ? (
                  <Callout>
                    <View style={{ padding: 6, maxWidth: 200 }}>
                      <Text style={{ fontWeight: '700' }}>{village.nameDisplay}</Text>
                      <Text style={{ fontSize: 12, marginTop: 4 }}>Qunarly ауылы</Text>
                    </View>
                  </Callout>
                ) : null}
              </Marker>
            ))
          : null}
        {routeStart && Marker ? <Marker coordinate={routeStart} pinColor="green" /> : null}
        {routeEnd && Marker ? <Marker coordinate={routeEnd} pinColor="red" /> : null}
        {routeData && Polyline ? (
          <>
            <Polyline coordinates={routeData.coordinates} strokeColor="#0F172A" strokeWidth={6} />
            <Polyline coordinates={routeData.coordinates} strokeColor="#22C55E" strokeWidth={3} />
          </>
        ) : null}
        {Marker
          ? driverMarkers.map((marker) => (
              <Marker
                key={`driver-${marker.id}`}
                coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                pinColor={isDriverStale(marker) ? '#94A3B8' : '#22C55E'}
              >
                {Callout ? (
                  <Callout>
                    <View style={{ padding: 6, maxWidth: 200 }}>
                      <Text style={{ fontWeight: '700' }}>{marker.displayName ?? 'Жеткізуші'}</Text>
                      <Text style={{ fontSize: 12, marginTop: 4 }}>
                        Түрі: {marker.driverType ?? '—'}
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 2 }}>
                        Жаңартылды: {marker.updatedAt ?? '—'}
                      </Text>
                    </View>
                  </Callout>
                ) : null}
              </Marker>
            ))
          : null}
        {selectedLocation && Marker ? (
          <Marker coordinate={{ latitude: selectedLocation.lat, longitude: selectedLocation.lng }} />
        ) : null}
      </MapView>

      <View style={styles.overlay}>
        {isApiKeyMissing ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Google Maps API key табылмады. `qunarly-mobile/.env` файлын тексеріңіз.
            </Text>
          </View>
        ) : null}
        {driverError ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{driverError}</Text>
          </View>
        ) : null}
        {villagesError ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{villagesError}</Text>
          </View>
        ) : null}
        {contributeMode ? (
          <View style={styles.contributeHint}>
            <Text style={styles.contributeHintText}>Үйіңіздің қақпасын картадан белгілеңіз</Text>
          </View>
        ) : null}
        {searchMode ? (
          <View style={styles.searchPanel}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Іздеу..."
              placeholderTextColor={theme.colors.placeholder}
              autoFocus
            />
            <View style={styles.searchActions}>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchHint(null);
                  setSearchError(null);
                  setSearchLoading(false);
                }}
              >
                <Text style={styles.searchActionText}>Тазалау</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSearchMode(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setSearchHint(null);
                  setSearchError(null);
                  setSearchLoading(false);
                }}
              >
                <Text style={styles.searchActionText}>Жабу</Text>
              </TouchableOpacity>
            </View>
            {searchLoading ? <Text style={styles.resultEmpty}>Іздеу...</Text> : null}
            {searchError ? <Text style={styles.resultEmpty}>{searchError}</Text> : null}
            {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
              <View>
                <Text style={styles.resultEmpty}>Ештеңе табылмады</Text>
                <Text style={styles.resultEmpty}>Картадан таңдаңыз</Text>
              </View>
            ) : null}
            {searchHint ? <Text style={styles.resultEmpty}>{searchHint}</Text> : null}
            {searchHint ? (
              <TouchableOpacity
                style={styles.searchCta}
                onPress={() => {
                  setContributeMode(true);
                  setPendingPoint(null);
                  setSearchMode(false);
                }}
              >
                <Text style={styles.searchCtaText}>Үй орнын белгілеу</Text>
              </TouchableOpacity>
            ) : null}
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
            {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultItem}
                  onPress={() => {
                    setSearchMode(false);
                    setSearchResults([]);
                    setSearchQuery('');
                    setSelectedLocation({
                      lat: item.lat,
                      lng: item.lng,
                      title: item.title,
                      subtitle: item.subtitle,
                      source: item.sourceType === 'addressPoint' ? 'savedPoi' : 'search',
                      confirmCount: item.confirmCount,
                      streetCount: item.streetCount,
                    });
                    const nextRegion = {
                      ...region,
                      latitude: item.lat,
                      longitude: item.lng,
                    };
                    setRegion(nextRegion);
                    mapRef.current?.animateToRegion(nextRegion, 350);
                  }}
                >
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                {item.confirmCount ? (
                  <Text style={styles.resultSubtitle}>
                    Бұл мекенжайды {item.confirmCount} адам растаған
                  </Text>
                ) : null}
                {item.streetCount ? (
                  <Text style={styles.resultSubtitle}>
                    Бұл көшеде {item.streetCount} үй белгіленген
                  </Text>
                ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <TouchableOpacity style={styles.searchBar} onPress={() => setSearchMode(true)}>
            <Text style={styles.searchText}>Іздеу...</Text>
          </TouchableOpacity>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {[
            { label: 'Алқаптар', value: showFields, toggle: () => setShowFields((v) => !v) },
            { label: 'Нысандар', value: showFacilities, toggle: () => setShowFacilities((v) => !v) },
            { label: 'Жеткізу', value: showDelivery, toggle: () => setShowDelivery((v) => !v) },
            { label: 'Такси/логистика', value: showTaxi, toggle: () => setShowTaxi((v) => !v) },
          ].map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={[styles.chip, chip.value && styles.chipActive]}
              onPress={chip.toggle}
            >
              <Text style={[styles.chipText, chip.value && styles.chipTextActive]}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.gpsButton}
        onPress={() => {
          if (!userLocation) {
            return;
          }
          const nextRegion = {
            ...region,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          };
          setRegion(nextRegion);
          mapRef.current?.animateToRegion(nextRegion, 350);
          setRouteStart({ latitude: userLocation.latitude, longitude: userLocation.longitude });
        }}
      >
        <Ionicons name="locate" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.mapTypeButton}
        onPress={() => setMapType((prev) => (prev === 'hybrid' ? 'standard' : 'hybrid'))}
      >
        <Text style={styles.mapTypeButtonText}>{mapType === 'hybrid' ? 'Схема' : 'Спутник'}</Text>
      </TouchableOpacity>

      {selectedLocation ? (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.selectedTitle}>{selectedLocation.title}</Text>
          <Text style={styles.selectedSubtitle}>{selectedLocation.subtitle}</Text>
          {selectedLocation.confirmCount ? (
            <Text style={styles.infoText}>Бұл мекенжайды {selectedLocation.confirmCount} адам растаған</Text>
          ) : null}
          {selectedLocation.streetCount ? (
            <Text style={styles.infoText}>Бұл көшеде {selectedLocation.streetCount} үй белгіленген</Text>
          ) : null}
          {routeDistance ? (
            <Text style={styles.infoText}>
              Қашықтық: {routeDistance.toFixed(1)} км • Уақыт: {etaMinutes} мин
            </Text>
          ) : (
            <Text style={styles.infoText}>Маршрут үшін алып кету/жеткізу нүктесін таңдаңыз.</Text>
          )}
          {routeData?.fallback ? <Text style={styles.infoText}>{routeData.warning}</Text> : null}
          {contributeMode ? (
            <View style={styles.selectedActions}>
              <TouchableOpacity style={[styles.selectedButton, styles.selectedButtonPrimary]} onPress={saveAddressPoint}>
                <Text style={styles.selectedButtonTextPrimary}>Сақтау</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectedButton}
                onPress={() => {
                  setContributeMode(false);
                  setPendingPoint(null);
                }}
              >
                <Text style={styles.selectedButtonText}>Өткізіп жіберу</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.selectedButton}
              onPress={() =>
                setRouteStart({ latitude: selectedLocation.lat, longitude: selectedLocation.lng })
              }
            >
              <Text style={styles.selectedButtonText}>Алып кету</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectedButton}
              onPress={() =>
                setRouteEnd({ latitude: selectedLocation.lat, longitude: selectedLocation.lng })
              }
            >
              <Text style={styles.selectedButtonText}>Жеткізу</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectedButton}
              onPress={() => {
                if (!routeStart) {
                  const origin = userLocation
                    ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                    : { latitude: selectedLocation.lat, longitude: selectedLocation.lng };
                  if (!userLocation) {
                    Alert.alert('Ескерту', 'GPS табылмады, маршрут таңдалған нүктеден басталады.');
                  }
                  setRouteStart(origin);
                  setRouteEnd({ latitude: selectedLocation.lat, longitude: selectedLocation.lng });
                  return;
                }
                setRouteEnd({ latitude: selectedLocation.lat, longitude: selectedLocation.lng });
              }}
            >
              <Text style={styles.selectedButtonText}>Бару</Text>
            </TouchableOpacity>
            {routeStart && routeEnd ? (
              <TouchableOpacity style={styles.selectedButton} onPress={openExternalNavigation}>
                <Text style={styles.selectedButtonText}>Навигация</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          )}
          <View style={styles.panelRow}>
            <TouchableOpacity
              style={[styles.panelButton, drawMode && styles.panelButtonPrimary]}
              onPress={() => {
                setDrawMode((prev) => !prev);
                setDraftPoints([]);
              }}
            >
              <Text style={[styles.panelButtonText, drawMode && styles.panelButtonTextPrimary]}>
                Алқап салу
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.panelButton, styles.panelButtonPrimary]}
              onPress={() => {
                setRouteStart(null);
                setRouteEnd(null);
                setRouteData(null);
              }}
            >
              <Text style={styles.panelButtonTextPrimary}>Маршрут тазалау</Text>
            </TouchableOpacity>
          </View>
          {drawMode ? (
            <View style={styles.panelRow}>
              <TouchableOpacity style={[styles.panelButton, styles.panelButtonPrimary]} onPress={finishField}>
                <Text style={styles.panelButtonTextPrimary}>Аяқтау</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.panelButton}
                onPress={() => {
                  setDraftPoints([]);
                }}
              >
                <Text style={styles.panelButtonText}>Нүктелерді өшіру</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
