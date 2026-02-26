import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';

type OpenTrip = {
  id: string;
  remainingSeats: number;
  totalSeats: number;
  bookedSeats: number;
  driver?: { displayName?: string | null };
  route?: { fromHub?: { name?: string }; toHub?: { name?: string } };
};

export default function OpenTripsListScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const [trips, setTrips] = useState<OpenTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatCount, setSeatCount] = useState('1');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    if (!routeId) return;
    try {
      const res = await api.get<OpenTrip[]>('/trips/open', { params: { routeId } });
      setTrips(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log('[OpenTrips] load failed', e);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleJoin = async (tripId: string) => {
    const seats = parseInt(seatCount, 10);
    if (isNaN(seats) || seats < 1) {
      Alert.alert('Қате', 'Орын санын дұрыс енгізіңіз');
      return;
    }
    setJoiningId(tripId);
    try {
      await api.post(`/trips/${tripId}/join`, { seatCount: seats });
      router.replace(`/trips/passenger/${tripId}`);
    } catch (e: any) {
      Alert.alert('Қате', parseApiError(e).message);
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.seatRow, { borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.text }}>Орын саны:</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          value={seatCount}
          onChangeText={setSeatCount}
          keyboardType="number-pad"
          placeholder="1"
        />
      </View>
      {trips.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.mutedText }]}>
          Ашық рейстер жоқ. Күте тұрыңыз немесе кейін қайта көріңіз.
        </Text>
      ) : (
        trips.map((t) => {
          const driverName = t.driver?.displayName ?? 'Жүргізуші';
          const fromName = t.route?.fromHub?.name ?? '?';
          const toName = t.route?.toHub?.name ?? '?';
          const seats = parseInt(seatCount, 10) || 1;
          const canJoin = seats <= t.remainingSeats;
          const joining = joiningId === t.id;

          return (
            <View key={t.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.routeText, { color: theme.colors.text }]}>
                {fromName} → {toName}
              </Text>
              <Text style={{ color: theme.colors.mutedText }}>
                {driverName} • қалған орын: {t.remainingSeats}
              </Text>
              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  {
                    backgroundColor: canJoin ? theme.colors.primary : theme.colors.mutedText,
                    opacity: joining ? 0.6 : 1,
                  },
                ]}
                onPress={() => handleJoin(t.id)}
                disabled={!canJoin || joining}
              >
                <Text style={{ color: theme.colors.surface }}>
                  {joining ? 'Қосылуда...' : 'Қосылу'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  input: {
    width: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
  },
  empty: { textAlign: 'center', marginTop: 32 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  routeText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  joinBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
