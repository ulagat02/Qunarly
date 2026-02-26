import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from '@/lib/api/client';
import { useTheme } from '@/src/mobile/theme';
import { ConfirmedIcon, WaitingIcon } from '@/src/mobile/components/TaxiIcons';

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
  assignedDriver?: { displayName?: string | null; phone?: string | null } | null;
};

export default function PassengerWaitScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const requestId = typeof params.requestId === 'string' ? params.requestId : null;
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    const loadRequest = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/taxi/requests/${requestId}`);
        if (!cancelled) {
          setRequest(response.data ?? null);
          setError(false);
        }
      } catch (error) {
        console.log('[PassengerWait] request failed', error);
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadRequest();
    const timer = setInterval(loadRequest, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [requestId]);

  const isAccepted = request?.status && ['MATCHED', 'CONFIRMED', 'DRIVER_EN_ROUTE', 'IN_RIDE'].includes(request.status);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
        {!requestId ? (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>Тапсырыс табылмады</Text>
            <Text style={styles.helperText}>Кері қайтып қайта бастаңыз.</Text>
          </>
        ) : null}
        {requestId && error ? (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>Қате шықты</Text>
            <Text style={styles.helperText}>Байланыс үзіліп қалды. Қайталап көріңіз.</Text>
            <TouchableOpacity
              style={[styles.buttonOutline, { borderColor: theme.colors.border }]}
              onPress={async () => {
                setError(false);
                setLoading(true);
                try {
                  const response = await api.get(`/taxi/requests/${requestId}`);
                  setRequest(response.data ?? null);
                  setError(false);
                } catch (err) {
                  setError(true);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Қайталап көру</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {requestId && !error && !loading ? (
          <>
            {!isAccepted ? (
              <>
                <WaitingIcon size={24} color="#6B7280" />
                <Text style={[styles.title, { color: theme.colors.text }]}>Қабылдауды күтуде…</Text>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.helperText, { marginTop: 8 }]}>
                  Жүргізуші жауап беріп жатыр
                </Text>
              </>
            ) : (
              <>
                <ConfirmedIcon size={24} color="#6B7280" />
                <Text style={[styles.title, { color: theme.colors.text }]}>Жол қабылданды</Text>
                <Text style={styles.helperText}>
                  Жүргізуші: {request?.assignedDriver?.displayName ?? '—'}
                </Text>
                <Text style={styles.helperText}>
                  Телефон: {request?.assignedDriver?.phone ?? '—'}
                </Text>
                {request?.assignedDriver?.phone ? (
                  <TouchableOpacity
                    style={[styles.buttonOutline, { borderColor: theme.colors.border }]}
                    onPress={() => Linking.openURL(`tel:${request?.assignedDriver?.phone}`)}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>📞 Қоңырау шалу</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </>
        ) : null}
        {requestId && !error && loading ? (
          <>
            <Text style={[styles.title, { color: theme.colors.text }]}>Жүктелуде…</Text>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
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
  helperText: {
    fontSize: 13,
    color: '#6B7280',
  },
  buttonOutline: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#F3F4F6',
  },
});
