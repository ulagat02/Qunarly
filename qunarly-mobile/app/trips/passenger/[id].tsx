import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
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
  route?: { fromHub?: { name?: string }; toHub?: { name?: string } };
  driver?: { displayName?: string | null; phone?: string | null };
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ашық',
  CLOSING: 'Жабылып жатыр',
  IN_PROGRESS: 'Жолда',
};

export default function PassengerTripScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeBooking, loading: activeLoading, refresh } = useMeActive();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTrip = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/trips/${id}`);
      setTrip(res.data);
    } catch (e) {
      console.log('[PassengerTrip] load failed', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    if (!activeLoading && !activeBooking?.trip?.id && id) {
      router.replace('/taxi');
    }
  }, [activeLoading, activeBooking, id, router]);

  const handleLeave = async () => {
    if (!id) return;
    Alert.alert('Шығу', 'Рейстен шығасың ба?', [
      { text: 'Жоқ', style: 'cancel' },
      {
        text: 'Иә',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/trips/${id}/leave`);
            await refresh();
            router.replace('/taxi');
          } catch (e) {
            Alert.alert('Қате', parseApiError(e).message);
          }
        },
      },
    ]);
  };

  const callDriver = () => {
    const phone = trip?.driver?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
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
  const canLeave = ['OPEN', 'CLOSING'].includes(trip.status);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.routeText, { color: theme.colors.text }]}>
          {fromName} → {toName}
        </Text>
        <Text style={[styles.statusText, { color: theme.colors.mutedText }]}>
          {STATUS_LABEL[trip.status] ?? trip.status}
        </Text>
        {trip.driver && (
          <View style={styles.driverRow}>
            <Text style={{ color: theme.colors.text }}>
              Жүргізуші: {trip.driver.displayName ?? 'Жүргізуші'}
            </Text>
            {trip.driver.phone && (
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: theme.colors.primary }]}
                onPress={callDriver}
              >
                <Text style={{ color: theme.colors.surface }}>Қоңырау шалу</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {canLeave && (
        <TouchableOpacity
          style={[styles.leaveBtn, { borderColor: theme.colors.border }]}
          onPress={handleLeave}
        >
          <Text style={{ color: theme.colors.text }}>Шығу / болдырмау</Text>
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
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  callBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  leaveBtn: { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
