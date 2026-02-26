import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api/client';
import { useTheme } from '@/src/mobile/theme';
import { TaxiIcon, QueueIcon } from '@/src/mobile/components/TaxiIcons';

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

type QueueDriver = {
  driverId: string;
  displayName: string;
  phone: string | null;
  availableSeats: number;
  capacity: number;
};

export default function DriverQueueScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeId = typeof params.routeId === 'string' ? params.routeId : null;
  const [route, setRoute] = useState<TaxiRoute | null>(null);
  const [queueDrivers, setQueueDrivers] = useState<QueueDriver[]>([]);
  const [capacity, setCapacity] = useState('4');

  const loadRoute = async () => {
    if (!routeId) return;
    try {
      const response = await api.get('/taxi/routes', { params: { mode: 'driver' } });
      const items = response.data ?? [];
      const found = items.find((r: TaxiRoute) => r.id === routeId);
      setRoute(found ?? null);
    } catch (error) {
      console.log('[DriverQueue] routes failed', error);
    }
  };

  const loadQueueDrivers = async () => {
    if (!routeId) return;
    try {
      const res = await api.get('/taxi/queue/drivers', { params: { routeId } });
      setQueueDrivers(res.data ?? []);
    } catch (error) {
      console.log('[DriverQueue] queue drivers failed', error);
    }
  };

  const scheduleOnTheWayNotifications = async (routeKey: string) => {
    if (Platform.OS === 'web') return;
    try {
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
      await AsyncStorage.setItem(`driver_queue_notifications_${routeKey}`, JSON.stringify(ids));
    } catch (error) {
      console.log('[DriverQueue] schedule notifications failed', error);
    }
  };

  useEffect(() => {
    loadRoute();
    loadQueueDrivers();
    const timer = setInterval(loadQueueDrivers, 8000);
    return () => clearInterval(timer);
  }, [routeId]);

  const handleJoinQueue = async () => {
    if (!routeId) return;
    const seatsNumber = Number(capacity);
    if (!Number.isFinite(seatsNumber) || seatsNumber < 1) {
      Alert.alert('Қате', 'Бос орын санын енгізіңіз.');
      return;
    }
    try {
      await api.post('/drivers/queue/join', {
        routeId,
        capacity: seatsNumber,
      });
      const joinedAt = Date.now();
      await Promise.all([
        AsyncStorage.setItem(`driver_queue_joined_at_${routeId}`, String(joinedAt)),
        AsyncStorage.setItem(`driver_queue_prompt_count_${routeId}`, '0'),
        AsyncStorage.setItem(`driver_queue_last_prompt_${routeId}`, '0'),
        AsyncStorage.setItem('driver_queue_active_route', routeId),
      ]);
      await scheduleOnTheWayNotifications(routeId);
      router.replace({ pathname: '/taxi/driver/active', params: { routeId } });
    } catch (error) {
      Alert.alert('Қате', 'Кезекке қосылмады');
    }
  };

  const routeTitle = route?.fromHub?.name && route?.toHub?.name
    ? `${route.fromHub.name} → ${route.toHub.name}`
    : 'Маршрут';

  const seatsNumber = Number(capacity);
  const canJoin = Number.isFinite(seatsNumber) && seatsNumber > 0;
  const normalizedSeats = Number.isFinite(seatsNumber) && seatsNumber > 0 ? seatsNumber : 1;
  const adjustCapacity = (delta: number) => {
    const next = Math.min(8, Math.max(1, normalizedSeats + delta));
    setCapacity(String(next));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
        <View style={styles.titleRow}>
          <QueueIcon size={20} color="#111827" />
          <Text style={[styles.title, { color: theme.colors.text }]}>Кезек</Text>
        </View>
          <Text style={styles.helperText}>
            Алдымен кезекті көр.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>{routeTitle}</Text>
          <Text style={styles.helperText}>Кезекте: {queueDrivers.length} жүргізуші</Text>
          {queueDrivers.length ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              {queueDrivers.map((driver, idx) => (
                <View key={driver.driverId} style={[styles.cardRow, { borderColor: theme.colors.border }]}>
                  <Text style={styles.driverName}>{driver.displayName}</Text>
                  <Text style={styles.driverSeats}>{driver.availableSeats} орын</Text>
                  <View style={styles.callButtonPlaceholder} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <TaxiIcon size={24} color="#6B7280" />
              <Text style={styles.emptyTitle}>Кезек ашылған жоқ</Text>
              <Text style={styles.emptyText}>Кезек ашылса бірден көресіз.</Text>
            </View>
          )}
        </View>
        <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
          <Text style={styles.helperText}>
            Кезектің ең соңына тұру үшін алдымен бос орын санын енгіз.
          </Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: theme.colors.border }]}
              onPress={() => adjustCapacity(-1)}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>−</Text>
            </TouchableOpacity>
            <View style={[styles.counterValue, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{normalizedSeats}</Text>
            </View>
            <TouchableOpacity
              style={[styles.counterButton, { borderColor: theme.colors.border }]}
              onPress={() => adjustCapacity(1)}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.stickyBar, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: canJoin ? theme.colors.primary : theme.colors.border }]}
          onPress={handleJoinQueue}
          disabled={!canJoin}
        >
          <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Кезекке тұру</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    flex: 1,
    color: '#111827',
    fontWeight: '600',
  },
  driverSeats: {
    color: '#6B7280',
    fontSize: 13,
  },
  callButtonPlaceholder: {
    width: 34,
    height: 34,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  counterValue: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    marginTop: 12,
    alignItems: 'center',
    gap: 6,
  },
  emptyIcon: {
    fontSize: 22,
  },
  emptyTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
