import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';

type QRPayload = {
  token: string;
  legId: string;
  receiverLat?: number;
  receiverLng?: number;
};

export default function HandoffSendScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualLegId, setManualLegId] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        overlay: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: 'rgba(0,0,0,0.4)',
        },
        fallbackPanel: {
          padding: 16,
          gap: 12,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        },
        hint: {
          color: '#fff',
          textAlign: 'center',
          marginBottom: 12,
        },
        button: {
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#fff',
          alignItems: 'center',
          marginBottom: 8,
        },
        buttonText: {
          color: '#fff',
          fontWeight: '600',
        },
      }),
    [theme],
  );

  useEffect(() => {
    requestPermission();
  }, []);

  const handleConfirm = async (payload: QRPayload) => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Қате', 'Локацияға рұқсат берілмеді.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      await api.post(`/delivery/legs/${payload.legId}/handoff/confirm`, {
        token: payload.token,
        senderLat: location.coords.latitude,
        senderLng: location.coords.longitude,
        receiverLat: payload.receiverLat,
        receiverLng: payload.receiverLng,
      });
      Alert.alert('Сәтті', 'Эстафета табысталды.');
      router.back();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
      setScanned(false);
    }
  };

  const parsePayload = (raw: string): QRPayload | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed) as QRPayload;
      if (parsed?.token && parsed?.legId) {
        return parsed;
      }
    } catch {
      // ignore and try manual code
    }
    if (trimmed.length >= 6 && trimmed.length <= 64 && manualLegId.trim()) {
      return { token: trimmed, legId: manualLegId.trim() };
    }
    return null;
  };

  const onScanned = ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    const payload = parsePayload(data);
    if (!payload) {
      Alert.alert('Қате', 'QR форматы дұрыс емес.');
      setScanned(false);
      return;
    }
    handleConfirm(payload);
  };

  const handleManualConfirm = () => {
    const payload = parsePayload(manualCode);
    if (!payload) {
      Alert.alert('Қате', 'Код немесе Leg ID дұрыс емес.');
      return;
    }
    handleConfirm(payload);
  };

  if (permission?.granted === false) {
    return (
      <View style={[styles.container, styles.fallbackPanel]}>
        <Text style={{ color: theme.colors.text, textAlign: 'center' }}>
          Камераға рұқсат берілмеді. Қолмен код енгізіңіз.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Leg ID"
          placeholderTextColor={theme.colors.placeholder}
          value={manualLegId}
          onChangeText={setManualLegId}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Код немесе QR мәтіні"
          placeholderTextColor={theme.colors.placeholder}
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleManualConfirm}>
          <Text style={styles.buttonText}>Қолмен растау</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Артқа</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!manualMode && permission?.granted ? (
        <CameraView
          onBarcodeScanned={scanned ? undefined : onScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      {manualMode ? (
        <View style={styles.fallbackPanel}>
          <Text style={{ color: theme.colors.text, textAlign: 'center' }}>
            Қолмен енгізу режимі
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Leg ID"
            placeholderTextColor={theme.colors.placeholder}
            value={manualLegId}
            onChangeText={setManualLegId}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Код немесе QR мәтіні"
            placeholderTextColor={theme.colors.placeholder}
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleManualConfirm}>
            <Text style={styles.buttonText}>Қолмен растау</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setManualMode(false)}>
            <Text style={styles.buttonText}>Камераға қайту</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Артқа</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.overlay}>
          <Text style={styles.hint}>QR кодты жақындатып сканерлеңіз</Text>
          <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
            <Text style={styles.buttonText}>Қайта сканерлеу</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => setManualMode(true)}>
            <Text style={styles.buttonText}>Қолмен енгізу</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Артқа</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
