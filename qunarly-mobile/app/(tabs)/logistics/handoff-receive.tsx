import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import QRCode from 'react-native-qrcode-svg';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';

export default function HandoffReceiveScreen() {
  const { legId } = useLocalSearchParams<{ legId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [tokenPayload, setTokenPayload] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
        },
        hint: {
          color: theme.colors.mutedText,
          textAlign: 'center',
        },
        button: {
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
        buttonText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const generateToken = async () => {
    if (!legId || typeof legId !== 'string') {
      Alert.alert('Қате', 'Leg ID табылмады.');
      return;
    }
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Қате', 'Локацияға рұқсат берілмеді.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const response = await api.post(`/delivery/legs/${legId}/handoff/token`);
      const payload = {
        token: response.data?.token,
        legId,
        receiverLat: position.coords.latitude,
        receiverLng: position.coords.longitude,
      };
      if (!payload.token) {
        throw new Error('Token missing');
      }
      setTokenPayload(JSON.stringify(payload));
      setExpiresAt(response.data?.expiresAt ? new Date(response.data.expiresAt) : null);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateToken();
  }, []);

  useEffect(() => {
    if (!expiresAt) {
      setCountdown(0);
      return;
    }
    const tick = () => {
      const seconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setCountdown(seconds);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Қабылдау QR</Text>
      <Text style={styles.hint}>Сканерлеу үшін QR көрсетіңіз</Text>
      {tokenPayload ? <QRCode value={tokenPayload} size={220} /> : null}
      <Text style={styles.hint}>
        {countdown > 0 ? `Жарамдылық: ${countdown} сек` : 'Токен мерзімі аяқталды'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={generateToken} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Күтіңіз...' : 'Жаңарту'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Артқа</Text>
      </TouchableOpacity>
    </View>
  );
}
