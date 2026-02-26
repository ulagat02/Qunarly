import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';
import MapPicker from '@/src/mobile/components/MapPicker';
import { useUserProfile } from '@/src/mobile/store/userProfile';

export default function TasymalCreateScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dealId, setDealId] = useState('');
  const [originLat, setOriginLat] = useState('');
  const [originLng, setOriginLng] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLng, setDestLng] = useState('');
  const [originAddressText, setOriginAddressText] = useState('');
  const [destAddressText, setDestAddressText] = useState('');
  const [originRegion, setOriginRegion] = useState('');
  const [destRegion, setDestRegion] = useState('');
  const [cargoDescription, setCargoDescription] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [cargoVolume, setCargoVolume] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [packageType, setPackageType] = useState('');
  const [cargoNotes, setCargoNotes] = useState('');
  const [activePoint, setActivePoint] = useState<'origin' | 'dest'>('origin');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const { theme } = useTheme();
  const { profile } = useUserProfile();

  useEffect(() => {
    if (profile?.addressText && !originAddressText) {
      setOriginAddressText(profile.addressText);
    }
    if (profile?.lat && !originLat) {
      setOriginLat(String(profile.lat));
    }
    if (profile?.lng && !originLng) {
      setOriginLng(String(profile.lng));
    }
  }, [profile, originAddressText, originLat, originLng]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        container: {
          padding: 16,
          paddingBottom: 40,
          backgroundColor: theme.colors.background,
        },
        section: {
          marginBottom: 20,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 12,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        },
        row: {
          flexDirection: 'row',
          gap: 8,
        },
        halfInput: {
          flex: 1,
        },
        pointSelector: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 12,
        },
        pointButton: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 8,
          borderRadius: 8,
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
        },
        pointButtonActive: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.background,
        },
        pointButtonText: {
          color: theme.colors.mutedText,
          fontSize: 12,
          fontWeight: '600',
        },
        pointButtonTextActive: {
          color: theme.colors.primary,
        },
        mapHint: {
          fontSize: 12,
          color: theme.colors.mutedText,
          marginBottom: 12,
        },
        secondaryButton: {
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
          marginBottom: 12,
          alignSelf: 'flex-start',
        },
        secondaryText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        primaryButton: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
        },
        primaryText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  useEffect(() => {
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return;
      }
      setHasLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({});
      setOriginLat(location.coords.latitude.toFixed(6));
      setOriginLng(location.coords.longitude.toFixed(6));
    })();
  }, []);

  const useMyLocation = async () => {
    if (!hasLocationPermission) {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Қате', 'Локация рұқсаты қажет.');
        return;
      }
      setHasLocationPermission(true);
    }
    const location = await Location.getCurrentPositionAsync({});
    const latValue = location.coords.latitude.toFixed(6);
    const lngValue = location.coords.longitude.toFixed(6);
    setOriginLat(latValue);
    setOriginLng(lngValue);
  };

  const createShipment = async () => {
    if (!profile?.lat || !profile?.lng || !profile?.addressText) {
      Alert.alert('Қате', 'Алдымен профилде мекенжайды белгілеңіз.');
      return;
    }
    if (!originLat || !originLng || !destLat || !destLng || !originAddressText || !destAddressText) {
      Alert.alert('Қате', 'Координаттар мен мекенжайлар міндетті.');
      return;
    }
    if (!originRegion || !destRegion) {
      Alert.alert('Қате', 'Аймақтарды көрсетіңіз.');
      return;
    }
    if (!cargoType || !cargoWeight || !cargoVolume) {
      Alert.alert('Қате', 'Жүк түрі, салмағы және көлемі міндетті.');
      return;
    }
    const originLatValue = Number(originLat);
    const originLngValue = Number(originLng);
    const destLatValue = Number(destLat);
    const destLngValue = Number(destLng);
    if ([originLatValue, originLngValue, destLatValue, destLngValue].some((value) => Number.isNaN(value))) {
      Alert.alert('Қате', 'Дұрыс сан енгізіңіз.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/logistics/shipments', {
        dealId: dealId || undefined,
        originLat: originLatValue,
        originLng: originLngValue,
        destLat: destLatValue,
        destLng: destLngValue,
        originAddressText: originAddressText || undefined,
        destAddressText: destAddressText || undefined,
        originRegion: originRegion || undefined,
        destRegion: destRegion || undefined,
        cargoType: cargoType || undefined,
        volumeM3: Number(cargoVolume),
        weightKg: Number(cargoWeight),
        packageType: packageType || undefined,
        notes: cargoNotes || undefined,
        cargoJson: {
          description: cargoDescription || 'Жүк',
          weightKg: Number(cargoWeight),
        },
      });
      Alert.alert('Сәтті', 'Жүк тасымалы қосылды.');
      router.back();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Жаңа тасымал</Text>
          <TextInput
            style={styles.input}
            value={dealId}
            onChangeText={setDealId}
            placeholder="Келісім ID (міндетті емес)"
            placeholderTextColor={theme.colors.placeholder}
          />
          <View style={styles.pointSelector}>
            <TouchableOpacity
              style={[styles.pointButton, activePoint === 'origin' && styles.pointButtonActive]}
              onPress={() => setActivePoint('origin')}
            >
              <Text
                style={[styles.pointButtonText, activePoint === 'origin' && styles.pointButtonTextActive]}
              >
                Бастапқы нүкте
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pointButton, activePoint === 'dest' && styles.pointButtonActive]}
              onPress={() => setActivePoint('dest')}
            >
              <Text
                style={[styles.pointButtonText, activePoint === 'dest' && styles.pointButtonTextActive]}
              >
                Мақсат нүкте
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={originLat}
              placeholder="Origin Lat"
              placeholderTextColor={theme.colors.placeholder}
              editable={false}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={originLng}
              placeholder="Origin Lng"
              placeholderTextColor={theme.colors.placeholder}
              editable={false}
            />
          </View>
          <TextInput
            style={styles.input}
            value={originAddressText}
            onChangeText={setOriginAddressText}
            placeholder="Бастапқы мекенжай"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={originRegion}
            onChangeText={setOriginRegion}
            placeholder="Бастапқы аймақ"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={destAddressText}
            onChangeText={setDestAddressText}
            placeholder="Мақсат мекенжай"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={destRegion}
            onChangeText={setDestRegion}
            placeholder="Мақсат аймақ"
            placeholderTextColor={theme.colors.placeholder}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={destLat}
              placeholder="Dest Lat"
              placeholderTextColor={theme.colors.placeholder}
              editable={false}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={destLng}
              placeholder="Dest Lng"
              placeholderTextColor={theme.colors.placeholder}
              editable={false}
            />
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={useMyLocation}>
            <Text style={styles.secondaryText}>Менің орнымды алу (Origin)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowMapPicker(true)}>
            <Text style={styles.secondaryText}>
              Картадан {activePoint === 'origin' ? 'бастапқы' : 'мақсат'} нүкте
            </Text>
          </TouchableOpacity>
          {(originLat && originLng) || (destLat && destLng) ? (
            <Text style={styles.mapHint}>
              Бастапқы: {originLat || '—'}, {originLng || '—'} | Мақсат: {destLat || '—'}, {destLng || '—'}
            </Text>
          ) : null}
          <TextInput
            style={styles.input}
            value={cargoDescription}
            onChangeText={setCargoDescription}
            placeholder="Жүк сипаттамасы"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={cargoWeight}
            onChangeText={setCargoWeight}
            placeholder="Салмағы (кг)"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={cargoVolume}
            onChangeText={setCargoVolume}
            placeholder="Көлемі (м3)"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={cargoType}
            onChangeText={setCargoType}
            placeholder="Жүк түрі (мыс: GRAIN)"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={packageType}
            onChangeText={setPackageType}
            placeholder="Орау түрі (optional)"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={cargoNotes}
            onChangeText={setCargoNotes}
            placeholder="Ескертпе (optional)"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={createShipment} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? 'Жіберілуде...' : 'Қосу'}</Text>
          </TouchableOpacity>
          <MapPicker
            visible={showMapPicker}
            title={activePoint === 'origin' ? 'Бастапқы нүкте' : 'Мақсат нүкте'}
            initialLat={
              activePoint === 'origin'
                ? originLat
                  ? Number(originLat)
                  : undefined
                : destLat
                  ? Number(destLat)
                  : undefined
            }
            initialLng={
              activePoint === 'origin'
                ? originLng
                  ? Number(originLng)
                  : undefined
                : destLng
                  ? Number(destLng)
                  : undefined
            }
            onPick={(coords) => {
              if (activePoint === 'origin') {
                setOriginLat(coords.lat.toFixed(6));
                setOriginLng(coords.lng.toFixed(6));
              } else {
                setDestLat(coords.lat.toFixed(6));
                setDestLng(coords.lng.toFixed(6));
              }
            }}
            onClose={() => setShowMapPicker(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
