import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';
import { useUserProfile } from '@/src/mobile/store/userProfile';
import { QueueIcon, CarIcon } from '@/src/mobile/components/TaxiIcons';
import { useFocusEffect } from '@react-navigation/native';

type DriverQueue = {
  status: 'IN_QUEUE' | 'OFFERED' | 'ON_TRIP' | 'OFFLINE' | 'REMOVED_INACTIVE';
  availableSeats?: number | null;
  joinedAt?: string;
};

type QueueDriver = {
  driverId: string;
  displayName: string;
  phone: string | null;
  availableSeats: number;
  capacity: number;
  joinedAt: string;
};

type QueuePassenger = {
  id: string;
  displayName?: string | null;
  seatsRequested: number;
  pickupLabel?: string | null;
  status?: 'PENDING' | 'MATCHED' | 'CANCELLED_BY_PASSENGER' | 'REMOVED_BY_DRIVER' | 'NO_SHOW' | 'EXPIRED';
};

type DriverOffer = {
  id: string;
  expiresAt?: string;
  request: {
    id: string;
    pickupText?: string | null;
    seats?: number | null;
    cargoType?: 'NONE' | 'SMALL' | 'LARGE';
    passenger?: { displayName?: string | null; phone?: string | null };
  };
};

type DriverActiveRequest = {
  id: string;
  status: 'MATCHED' | 'CONFIRMED' | 'DRIVER_EN_ROUTE' | 'IN_RIDE' | 'COMPLETED';
  pickupText?: string | null;
  seats?: number | null;
  passenger?: { displayName?: string | null; phone?: string | null };
};

type QueueStatusResponse = {
  queue: DriverQueue | null;
  passengerCount: number;
};

export default function DriverActiveScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { profile } = useUserProfile();
  const params = useLocalSearchParams();
  const routeId = typeof params.routeId === 'string' ? params.routeId : null;

  const [queueStatus, setQueueStatus] = useState<DriverQueue | null>(null);
  const [passengerCount, setPassengerCount] = useState(0);
  const [queueDrivers, setQueueDrivers] = useState<QueueDriver[]>([]);
  const [queuePassengers, setQueuePassengers] = useState<QueuePassenger[]>([]);
  const [pendingOffers, setPendingOffers] = useState<DriverOffer[]>([]);
  const [driverActiveRequest, setDriverActiveRequest] = useState<DriverActiveRequest | null>(null);

  const activeOffer = pendingOffers[0];
  const nextPassenger = queuePassengers[0] ?? null;
  const myPosition = useMemo(() => {
    const userId = profile?.userId;
    if (!userId) return null;
    const idx = queueDrivers.findIndex((driver) => driver.driverId === userId);
    return idx >= 0 ? idx + 1 : null;
  }, [queueDrivers, profile?.userId]);
  const queueProgress = useMemo(() => {
    const blocks = 4;
    if (!myPosition) {
      return '▓' + '░'.repeat(blocks - 1);
    }
    const filled = Math.max(1, blocks - Math.min(myPosition - 1, blocks - 1));
    return '▓'.repeat(filled) + '░'.repeat(blocks - filled);
  }, [myPosition]);

  const cancelOnTheWayNotifications = async (routeKey: string) => {
    if (Platform.OS === 'web') return;
    try {
      const stored = await AsyncStorage.getItem(`driver_queue_notifications_${routeKey}`);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
      }
      await AsyncStorage.removeItem(`driver_queue_notifications_${routeKey}`);
    } catch (error) {
      console.log('[DriverActive] cancel notifications failed', error);
    }
  };

  const refreshDriverState = async () => {
    if (!routeId) return;
    try {
      const [queueResponse, passengersResponse, offersResponse, driversResponse, activeRequestResponse] =
        await Promise.all([
        api.get('/drivers/queue/status', { params: { routeId } }),
        api.get('/drivers/queue/passengers', { params: { routeId, expireMinutes: 15 } }),
        api.get('/drivers/offers/pending'),
        api.get('/taxi/queue/drivers', { params: { routeId } }),
        api.get('/drivers/requests/active'),
      ]);
      const queueData = (queueResponse.data ?? null) as QueueStatusResponse | null;
      setQueueStatus(queueData?.queue ?? null);
      setPassengerCount(queueData?.passengerCount ?? 0);
      setQueuePassengers((passengersResponse.data ?? []).map((item: any) => ({
        id: item.id,
        displayName: item.displayName,
        seatsRequested: item.seatsRequested,
        pickupLabel: item.pickupLabel,
        status: item.status,
      })));
      setPendingOffers(offersResponse.data ?? []);
      setQueueDrivers(driversResponse.data ?? []);
      setDriverActiveRequest(activeRequestResponse.data ?? null);
    } catch (error) {
      console.log('[DriverActive] refresh failed', error);
    }
  };

  useEffect(() => {
    refreshDriverState();
    const timer = setInterval(refreshDriverState, 3000);
    return () => clearInterval(timer);
  }, [routeId]);

  // 30s ping while driver is in queue (IN_QUEUE or OFFERED)
  const PING_INTERVAL_MS = 30 * 1000;
  useEffect(() => {
    if (!routeId) return;
    const status = queueStatus?.status;
    if (status !== 'IN_QUEUE' && status !== 'OFFERED') return;
    const ping = () => {
      api.post('/drivers/queue/ping', { routeId }).catch((err) => {
        console.log('[DriverActive] queue ping failed', err);
      });
    };
    ping();
    const timer = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [routeId, queueStatus?.status]);

  useFocusEffect(
    useCallback(() => {
      refreshDriverState();
    }, [routeId]),
  );

  const handleLeaveQueue = async () => {
    if (!routeId) return;
    try {
      await api.post('/drivers/queue/inactive', { routeId });
      await Promise.all([
        AsyncStorage.removeItem(`driver_queue_joined_at_${routeId}`),
        AsyncStorage.removeItem(`driver_queue_prompt_count_${routeId}`),
        AsyncStorage.removeItem(`driver_queue_last_prompt_${routeId}`),
        AsyncStorage.removeItem('driver_queue_active_route'),
      ]);
      await cancelOnTheWayNotifications(routeId);
      router.replace({ pathname: '/taxi/driver/queue', params: { routeId } });
    } catch (error) {
      Alert.alert('Қате', 'Кезектен шығу мүмкін болмады');
    }
  };

  const handleDriverOnTheWay = async () => {
    if (!driverActiveRequest) return;
    try {
      await api.post(`/taxi/requests/${driverActiveRequest.id}/on-the-way`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const handleDriverArrived = async () => {
    if (!driverActiveRequest) return;
    try {
      await api.post(`/taxi/requests/${driverActiveRequest.id}/arrived`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const handleDriverPickedUp = async () => {
    if (!driverActiveRequest) return;
    try {
      await api.post(`/drivers/requests/${driverActiveRequest.id}/picked-up`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const handleDriverComplete = async () => {
    if (!driverActiveRequest) return;
    try {
      await api.post(`/taxi/requests/${driverActiveRequest.id}/complete`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const handleSkipActive = async () => {
    if (!driverActiveRequest) return;
    Alert.alert('Өткізу', 'Себебін таңдаңыз', [
      {
        text: 'Келмеді',
        onPress: async () => {
          try {
            await api.post(`/drivers/queue/passengers/${driverActiveRequest.id}/remove`, { reason: 'NO_SHOW' });
            await refreshDriverState();
          } catch (error) {
            const info = parseApiError(error);
            Alert.alert('Қате', info.message);
          }
        },
      },
      {
        text: 'Бас тартты',
        onPress: async () => {
          try {
            await api.post(`/drivers/queue/passengers/${driverActiveRequest.id}/remove`, { reason: 'REMOVED_BY_DRIVER' });
            await refreshDriverState();
          } catch (error) {
            const info = parseApiError(error);
            Alert.alert('Қате', info.message);
          }
        },
      },
      { text: 'Болдырмау', style: 'cancel' },
    ]);
  };

  const handleAcceptOffer = async () => {
    if (!activeOffer) return;
    try {
      await api.post(`/drivers/offers/${activeOffer.id}/accept`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const handleRejectOffer = async () => {
    if (!activeOffer) return;
    try {
      await api.post(`/drivers/offers/${activeOffer.id}/reject`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const handleConfirmPassenger = async (requestId: string) => {
    try {
      await api.post(`/drivers/queue/passengers/${requestId}/confirm`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const handleSkipPassenger = async (requestId: string) => {
    try {
      await api.post(`/drivers/queue/passengers/${requestId}/skip`);
      await refreshDriverState();
    } catch (error) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {driverActiveRequest ? (
        <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Қабылдадым</Text>
          <Text style={styles.helperText}>
            Келесі жолаушы: {driverActiveRequest.passenger?.displayName ?? '—'}
          </Text>
          <Text style={styles.helperText}>
            Орын: {driverActiveRequest.seats ?? 1}
          </Text>
          <Text style={styles.helperText}>
            Кездесу орны: {driverActiveRequest.pickupText ?? '—'}
          </Text>
          {driverActiveRequest.passenger?.phone ? (
            <Text style={styles.helperText}>Телефон: {driverActiveRequest.passenger?.phone}</Text>
          ) : null}
          <View style={{ marginTop: 10, gap: 8 }}>
            {driverActiveRequest.passenger?.phone ? (
              <TouchableOpacity
                style={[styles.buttonNeutral, { backgroundColor: theme.colors.primary }]}
                onPress={() => Linking.openURL(`tel:${driverActiveRequest.passenger?.phone}`)}
              >
                <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Қоңырау шалу</Text>
              </TouchableOpacity>
            ) : null}
            {driverActiveRequest.status === 'MATCHED' ? (
              <TouchableOpacity
                style={[styles.buttonNeutral, { backgroundColor: '#111827' }]}
                onPress={handleDriverOnTheWay}
              >
                <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Жолға шықтым</Text>
              </TouchableOpacity>
            ) : null}
            {driverActiveRequest.status === 'DRIVER_EN_ROUTE' ? (
              <TouchableOpacity
                style={[styles.buttonNeutral, { backgroundColor: '#111827' }]}
                onPress={handleDriverArrived}
              >
                <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Келдім</Text>
              </TouchableOpacity>
            ) : null}
            {driverActiveRequest.status === 'CONFIRMED' ? (
              <TouchableOpacity
                style={[styles.buttonNeutral, { backgroundColor: '#111827' }]}
                onPress={handleDriverPickedUp}
              >
                <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Отырды</Text>
              </TouchableOpacity>
            ) : null}
            {driverActiveRequest.status === 'IN_RIDE' ? (
              <TouchableOpacity
                style={[styles.buttonNeutral, { backgroundColor: '#111827' }]}
                onPress={handleDriverComplete}
              >
                <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Жеткіздім</Text>
              </TouchableOpacity>
            ) : null}
            {driverActiveRequest.status === 'MATCHED' || driverActiveRequest.status === 'CONFIRMED' ? (
              <TouchableOpacity
                style={[styles.buttonDanger, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
                onPress={handleSkipActive}
              >
                <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Өткізем</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
        <View style={styles.titleRow}>
          <QueueIcon size={20} color="#111827" />
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>СІЗ КЕЗЕКТЕСІҢІЗ</Text>
        </View>
        <Text style={[styles.positionText, { color: theme.colors.text }]}>
          №{myPosition ?? '—'}
        </Text>
        <Text style={styles.queueSubText}>Алдыңызда {myPosition ? Math.max(0, myPosition - 1) : '—'} көлік</Text>
        <Text style={styles.progressText}>{queueProgress}</Text>
        <View style={styles.metaRow}>
          <CarIcon size={18} color="#6B7280" />
          <Text style={styles.helperText}>Бос орын: {queueStatus?.availableSeats ?? '—'}</Text>
        </View>
        <View style={styles.metaRow}>
          <QueueIcon size={18} color="#6B7280" />
          <Text style={styles.helperText}>Кезекте: {passengerCount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.buttonDanger, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
          onPress={handleLeaveQueue}
        >
          <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Кезектен шығу</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Кезек тізімі</Text>
        {queueDrivers.length ? (
          <View style={{ gap: 8 }}>
            {queueDrivers.map((driver, idx) => (
              <View key={driver.driverId} style={[styles.cardRow, { borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                  №{idx + 1} • {driver.displayName}
                </Text>
                <Text style={styles.helperText}>
                  Бос орын: {driver.availableSeats}/{driver.capacity}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>Кезек ашылған жоқ.</Text>
        )}
      </View>

      {activeOffer && !driverActiveRequest ? (
        <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Тапсырыс түсті</Text>
          <Text style={styles.helperText}>
            Кездесу: {activeOffer.request?.pickupText ?? '—'}
          </Text>
          <Text style={styles.helperText}>
            Адам: {activeOffer.request?.seats ?? 1} • Жүк: {activeOffer.request?.cargoType ?? 'NONE'}
          </Text>
          {activeOffer.request?.passenger?.phone ? (
            <Text style={styles.helperText}>
              Телефон: {activeOffer.request?.passenger?.phone}
            </Text>
          ) : null}
          <View style={{ marginTop: 10, gap: 8 }}>
            <TouchableOpacity
              style={[styles.buttonNeutral, { backgroundColor: theme.colors.primary }]}
              onPress={handleAcceptOffer}
            >
              <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Қабылдаймын</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonDanger, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
              onPress={handleRejectOffer}
            >
              <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Өткізем</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!driverActiveRequest ? (
        <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Келесі жолаушы</Text>
          {nextPassenger ? (
            <View style={[styles.cardRow, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                {nextPassenger.displayName ?? 'Жолаушы'}
              </Text>
              <Text style={styles.helperText}>
                Орын: {nextPassenger.seatsRequested}
              </Text>
              {nextPassenger.pickupLabel ? (
                <Text style={styles.helperText}>Кездесу: {nextPassenger.pickupLabel}</Text>
              ) : null}
              {nextPassenger.status === 'PENDING' ? (
                <View style={{ marginTop: 10, gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.buttonNeutral, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleConfirmPassenger(nextPassenger.id)}
                  >
                    <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Қабылдаймын</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buttonDanger, { backgroundColor: theme.colors.error ?? '#DC2626' }]}
                    onPress={() => handleSkipPassenger(nextPassenger.id)}
                  >
                    <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Өткізем</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.helperText}>Жолаушы өңделіп жатыр.</Text>
              )}
            </View>
          ) : (
            <Text style={styles.helperText}>Кезек бос</Text>
          )}
        </View>
      ) : null}

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
  sectionLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
  },
  positionText: {
    fontSize: 26,
    fontWeight: '700',
  },
  progressText: {
    fontSize: 16,
    color: '#6B7280',
    letterSpacing: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueSubText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  buttonNeutral: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDanger: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
