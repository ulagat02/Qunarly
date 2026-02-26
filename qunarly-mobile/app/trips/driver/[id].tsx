import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';
import { useMeActive } from '@/src/mobile/hooks/useMeActive';

type TripData = {
  id: string;
  status: string;
  totalSeats: number;
  bookedSeats: number;
  closingUntil?: string | null;
  route?: { fromHub?: { name?: string }; toHub?: { name?: string } };
  bookings?: { seatCount: number; passenger?: { displayName?: string | null; phone?: string | null } }[];
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ашық',
  CLOSING: 'Жабылып жатыр',
  IN_PROGRESS: 'Жолда',
};

export default function DriverTripScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeTripSession, loading: activeLoading, refresh } = useMeActive();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTrip = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (e) {
      console.log('[DriverTrip] load failed', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    if (!activeLoading && !activeTripSession?.id && id) {
      router.replace('/taxi');
    }
  }, [activeLoading, activeTripSession, id, router]);

  const [countdown, setCountdown] = useState<number | null>(null);
  useEffect(() => {
    if (trip?.status === 'CLOSING' && trip.closingUntil) {
      const tick = () => {
        const sec = Math.max(0, Math.ceil((new Date(trip.closingUntil!).getTime() - Date.now()) / 1000));
        setCountdown(sec);
        if (sec <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
      tick();
      countdownRef.current = setInterval(tick, 500);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
    setCountdown(null);
    return undefined;
  }, [trip?.status, trip?.closingUntil]);

  const handleCloseIntent = async () => {
    if (!id) return;
    try {
      await api.post(`/trips/${id}/closeIntent`);
      await loadTrip();
    } catch (e) {
      Alert.alert('Қате', parseApiError(e).message);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      await api.post(`/trips/${id}/start`);
      await loadTrip();
    } catch (e) {
      Alert.alert('Қате', parseApiError(e).message);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    try {
      await api.post(`/trips/${id}/complete`);
      await refresh();
      router.replace('/taxi');
    } catch (e) {
      Alert.alert('Қате', parseApiError(e).message);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    Alert.alert('Болдырмау', 'Рейсті болдырмайсың ба?', [
      { text: 'Жоқ', style: 'cancel' },
      {
        text: 'Иә',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/trips/${id}/cancel`);
            await refresh();
            router.replace('/taxi');
          } catch (e) {
            Alert.alert('Қате', parseApiError(e).message);
          }
        },
      },
    ]);
  };

  if (loading || !trip) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Жүктелуде...</Text>
      </View>
    );
  }

  const fromName = trip.route?.fromHub?.name ?? '?';
  const toName = trip.route?.toHub?.name ?? '?';
  const remaining = trip.totalSeats - trip.bookedSeats;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.routeText, { color: theme.colors.text }]}>
          {fromName} → {toName}
        </Text>
        <Text style={[styles.statusText, { color: theme.colors.mutedText }]}>
          {STATUS_LABEL[trip.status] ?? trip.status}
        </Text>
        <Text style={{ color: theme.colors.text, marginTop: 8 }}>
          Орындар: {trip.bookedSeats}/{trip.totalSeats} (қалғаны: {remaining})
        </Text>
      </View>

      {trip.bookings && trip.bookings.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Жолаушылар</Text>
          {trip.bookings.map((b, i) => (
            <Text key={i} style={{ color: theme.colors.text, marginTop: 4 }}>
              • {b.passenger?.displayName ?? 'Жолаушы'} — {b.seatCount} орын
            </Text>
          ))}
        </View>
      )}

      {trip.status === 'OPEN' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.colors.primary }]}
            onPress={handleCloseIntent}
          >
            <Text style={{ color: theme.colors.surface }}>Кетем</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { borderColor: theme.colors.border }]}
            onPress={handleCancel}
          >
            <Text style={{ color: theme.colors.text }}>Рейсті болдырмау</Text>
          </TouchableOpacity>
        </View>
      )}

      {trip.status === 'CLOSING' && (
        <View style={styles.actions}>
          {countdown !== null && countdown > 0 && (
            <Text style={{ color: theme.colors.mutedText, marginBottom: 8 }}>
              Жолға шығуға: {countdown} сек
            </Text>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.colors.primary }]}
            onPress={handleStart}
          >
            <Text style={{ color: theme.colors.surface }}>Жолға шықтым</Text>
          </TouchableOpacity>
        </View>
      )}

      {trip.status === 'IN_PROGRESS' && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.colors.primary }]}
          onPress={handleComplete}
        >
          <Text style={{ color: theme.colors.surface }}>Жеттім</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 16 },
  routeText: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  statusText: { fontSize: 14, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  actions: { gap: 12, marginTop: 8 },
  btn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
});
