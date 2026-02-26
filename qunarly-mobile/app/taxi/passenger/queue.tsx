import { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function PassengerQueueScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeId = typeof params.routeId === 'string' ? params.routeId : null;
  const [route, setRoute] = useState<TaxiRoute | null>(null);
  const [queueDrivers, setQueueDrivers] = useState<QueueDriver[]>([]);

  const loadRoute = async () => {
    if (!routeId) return;
    try {
      const response = await api.get('/taxi/routes', { params: { mode: 'passenger', _ts: Date.now() } });
      const items = response.data ?? [];
      const found = items.find((r: TaxiRoute) => r.id === routeId);
      setRoute(found ?? null);
    } catch (error) {
      console.log('[PassengerQueue] routes failed', error);
    }
  };

  const loadQueueDrivers = async () => {
    if (!routeId) return;
    try {
      const res = await api.get('/taxi/queue/drivers', { params: { routeId } });
      setQueueDrivers(res.data ?? []);
    } catch (error) {
      console.log('[PassengerQueue] queue drivers failed', error);
    }
  };

  useEffect(() => {
    loadRoute();
    loadQueueDrivers();
    const timer = setInterval(loadQueueDrivers, 8000);
    return () => clearInterval(timer);
  }, [routeId]);

  const hasDrivers = queueDrivers.length > 0;
  const routeTitle = route?.fromHub?.name && route?.toHub?.name
    ? `${route.fromHub.name} → ${route.toHub.name}`
    : 'Маршрут';

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
          <Text style={styles.helperText}>
            {hasDrivers ? `Кезекте: ${queueDrivers.length} жүргізуші` : 'Кезек ашылған жоқ.'}
          </Text>
          {hasDrivers ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              {queueDrivers.map((driver, idx) => (
                <View key={driver.driverId} style={[styles.driverRow, { borderColor: theme.colors.border }]}>
                  <Text style={styles.driverName}>{driver.displayName}</Text>
                  <Text style={styles.driverSeats}>{driver.availableSeats} орын</Text>
                  {driver.phone ? (
                    <TouchableOpacity
                      style={[styles.callButton, { borderColor: '#E5E7EB' }]}
                      onPress={() => Linking.openURL(`tel:${driver.phone}`)}
                    >
                      <Text style={styles.callText}>📞</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.callButtonPlaceholder} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <TaxiIcon size={24} color="#6B7280" />
              <Text style={styles.emptyTitle}>Әзірге такси жоқ</Text>
              <Text style={styles.emptyText}>Жүргізуші кезекке тұрған кезде бірден көресіз.</Text>
              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: theme.colors.border }]}
                onPress={() => router.back()}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Бағыт ауыстыру</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={[styles.stickyBar, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: hasDrivers ? theme.colors.primary : theme.colors.border },
          ]}
          disabled={!hasDrivers}
          onPress={() => router.push({ pathname: '/taxi/passenger/request', params: { routeId } })}
        >
          <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Тапсырыс беру</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>Ауыл таксисі бар болса ғана тапсырыс ашылады.</Text>
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
  driverRow: {
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
  callButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  callButtonPlaceholder: {
    width: 34,
    height: 34,
  },
  callText: {
    fontSize: 16,
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
  outlineButton: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
