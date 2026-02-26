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

export default function AlapCreateScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [areaHa, setAreaHa] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [pickupAddressText, setPickupAddressText] = useState('');
  const [pickupRegion, setPickupRegion] = useState('');
  const [cargoWeightKg, setCargoWeightKg] = useState('');
  const [cargoVolumeM3, setCargoVolumeM3] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const { theme } = useTheme();
  const { profile } = useUserProfile();

  useEffect(() => {
    if (profile?.addressText && !pickupAddressText) {
      setPickupAddressText(profile.addressText);
    }
    if (profile?.lat && !lat) {
      setLat(String(profile.lat));
    }
    if (profile?.lng && !lng) {
      setLng(String(profile.lng));
    }
  }, [profile, pickupAddressText, lat, lng]);

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
      setLat(location.coords.latitude.toFixed(6));
      setLng(location.coords.longitude.toFixed(6));
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
    const latValue = location.coords.latitude;
    const lngValue = location.coords.longitude;
    setLat(latValue.toFixed(6));
    setLng(lngValue.toFixed(6));
  };

  const createJob = async () => {
    if (!profile?.lat || !profile?.lng || !profile?.addressText) {
      Alert.alert('Қате', 'Алдымен профилде мекенжайды белгілеңіз.');
      return;
    }
    if (!serviceTypeId || !areaHa || !lat || !lng) {
      Alert.alert('Қате', 'Қызмет түрі, аумақ және координаттар міндетті.');
      return;
    }
    if (!pickupRegion || !cargoWeightKg || !cargoVolumeM3 || !cargoType) {
      Alert.alert('Қате', 'Аймақ, салмақ, көлем және жүк түрі міндетті.');
      return;
    }
    const areaValue = Number(areaHa);
    const latValue = Number(lat);
    const lngValue = Number(lng);
    const distanceValue = distanceKm ? Number(distanceKm) : undefined;
    if ([areaValue, latValue, lngValue].some((value) => Number.isNaN(value))) {
      Alert.alert('Қате', 'Дұрыс сан енгізіңіз.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/field/jobs', {
        serviceTypeId,
        areaHa: areaValue,
        lat: latValue,
        lng: lngValue,
        pickupAddressText: pickupAddressText || undefined,
        pickupRegion,
        cargoWeightKg: Number(cargoWeightKg),
        cargoVolumeM3: Number(cargoVolumeM3),
        cargoType,
        distanceKm: distanceValue,
      });
      Alert.alert('Сәтті', 'Жұмыс жарияланды.');
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
          <Text style={styles.sectionTitle}>Жаңа жұмыс қосу</Text>
          <TextInput
            style={styles.input}
            value={serviceTypeId}
            onChangeText={setServiceTypeId}
            placeholder="Қызмет түрі ID"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={areaHa}
            onChangeText={setAreaHa}
            placeholder="Аумағы (га)"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={pickupAddressText}
            onChangeText={setPickupAddressText}
            placeholder="Мекенжай (міндетті емес)"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={pickupRegion}
            onChangeText={setPickupRegion}
            placeholder="Аймақ"
            placeholderTextColor={theme.colors.placeholder}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={lat}
              placeholder="Lat"
              placeholderTextColor={theme.colors.placeholder}
              editable={false}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={lng}
              placeholder="Lng"
              placeholderTextColor={theme.colors.placeholder}
              editable={false}
            />
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={useMyLocation}>
            <Text style={styles.secondaryText}>Менің орнымды алу</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowMapPicker(true)}>
            <Text style={styles.secondaryText}>Картадан таңдау</Text>
          </TouchableOpacity>
          {lat && lng ? <Text style={styles.mapHint}>Таңдалды: {lat}, {lng}</Text> : null}
          <TextInput
            style={styles.input}
            value={cargoWeightKg}
            onChangeText={setCargoWeightKg}
            placeholder="Салмағы (кг)"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={cargoVolumeM3}
            onChangeText={setCargoVolumeM3}
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
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="Қашықтық (км, міндетті емес)"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.primaryButton} onPress={createJob} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? 'Жіберілуде...' : 'Жариялау'}</Text>
          </TouchableOpacity>
          <MapPicker
            visible={showMapPicker}
            title="Жұмыс орны"
            initialLat={lat ? Number(lat) : undefined}
            initialLng={lng ? Number(lng) : undefined}
            onPick={(coords) => {
              setLat(coords.lat.toFixed(6));
              setLng(coords.lng.toFixed(6));
            }}
            onClose={() => setShowMapPicker(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
