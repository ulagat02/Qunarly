import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import api from '@/lib/api/client';
import { storeSessionFromToken } from '@/lib/auth/session';
import * as SecureStore from 'expo-secure-store';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';
import MapPicker from '@/src/mobile/components/MapPicker';

const roles = [
  { value: 'FARMER', label: 'Фермер' },
  { value: 'BUYER', label: 'Сатып алушы' },
  { value: 'EXECUTOR', label: 'Орындаушы' },
  { value: 'CARRIER', label: 'Тасымалдаушы' },
];

export default function RegisterScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FARMER');
  const [homeAddressText, setHomeAddressText] = useState('');
  const [homeRegion, setHomeRegion] = useState('');
  const [homeLat, setHomeLat] = useState('');
  const [homeLng, setHomeLng] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [maxWeightKg, setMaxWeightKg] = useState('');
  const [maxVolumeM3, setMaxVolumeM3] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [refrigerated, setRefrigerated] = useState(false);
  const [livestockAllowed, setLivestockAllowed] = useState(false);
  const [closedBody, setClosedBody] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        container: {
          flex: 1,
          padding: 20,
          justifyContent: 'center',
        },
        title: {
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 24,
          textAlign: 'center',
          color: theme.colors.text,
        },
        label: {
          fontSize: 14,
          marginBottom: 8,
          color: theme.colors.text,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 16,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        },
        roleContainer: {
          gap: 8,
          marginBottom: 16,
        },
        roleButton: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: theme.colors.surface,
        },
        roleActive: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.background,
        },
        roleText: {
          fontSize: 15,
          color: theme.colors.text,
        },
        roleTextActive: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        button: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginTop: 8,
        },
        mapHint: {
          color: theme.colors.mutedText,
          fontSize: 12,
          marginBottom: 12,
        },
        flagRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        buttonText: {
          color: theme.colors.surface,
          fontSize: 16,
          fontWeight: '600',
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 16,
        },
        footerText: {
          color: theme.colors.mutedText,
        },
        link: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const onRegister = async () => {
    if (!identifier || !password) {
      Alert.alert('Қате', 'Email немесе телефон және құпиясөз қажет.');
      return;
    }
    if (!homeAddressText.trim() || !homeRegion.trim() || !homeLat || !homeLng) {
      Alert.alert('Қате', 'Мекенжайды картадан таңдаңыз.');
      return;
    }
    if (role === 'CARRIER' && !maxWeightKg) {
      Alert.alert('Қате', 'Максималды салмақ міндетті.');
      return;
    }
    if (role === 'CARRIER' && !maxVolumeM3 && !vehicleType) {
      Alert.alert('Қате', 'Көлем немесе көлік түрін көрсетіңіз.');
      return;
    }
    setLoading(true);
    try {
      const basePayload =
        identifier.includes('@')
          ? { email: identifier, password, role }
          : { phone: identifier, password, role };
      const payload = {
        ...basePayload,
        homeAddressText: homeAddressText.trim(),
        homeRegion: homeRegion.trim(),
        homeLat: Number(homeLat),
        homeLng: Number(homeLng),
        ...(role === 'CARRIER'
          ? {
              maxWeightKg: Number(maxWeightKg),
              maxVolumeM3: maxVolumeM3 ? Number(maxVolumeM3) : undefined,
              vehicleType: vehicleType || undefined,
              refrigerated,
              livestockAllowed,
              closedBody,
            }
          : {}),
      };
      const response = await api.post('/auth/register', payload);
      const token = response.data?.accessToken;
      const refreshToken = response.data?.refreshToken;
      if (token) {
        await SecureStore.setItemAsync('qunarly_user_role', role);
        await storeSessionFromToken(token, refreshToken);
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
      if (info.kind === 'auth') {
        router.replace('/(auth)/login');
      }
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
      <Text style={styles.title}>Тіркелу</Text>
      <Text style={styles.label}>Email немесе телефон</Text>
      <TextInput
        style={styles.input}
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="example@mail.com немесе 7700..."
        placeholderTextColor={theme.colors.placeholder}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Құпиясөз</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Құпиясөз"
        placeholderTextColor={theme.colors.placeholder}
        secureTextEntry
      />
      <Text style={styles.label}>Рөліңіз</Text>
      <View style={styles.roleContainer}>
        {roles.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.roleButton, role === item.value && styles.roleActive]}
            onPress={() => setRole(item.value)}
          >
            <Text style={[styles.roleText, role === item.value && styles.roleTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Мекенжай</Text>
      <TextInput
        style={styles.input}
        value={homeAddressText}
        onChangeText={setHomeAddressText}
        placeholder="Мекенжай"
        placeholderTextColor={theme.colors.placeholder}
      />
      <TextInput
        style={styles.input}
        value={homeRegion}
        onChangeText={setHomeRegion}
        placeholder="Аймақ"
        placeholderTextColor={theme.colors.placeholder}
      />
      <TouchableOpacity style={styles.roleButton} onPress={() => setShowMapPicker(true)}>
        <Text style={styles.roleText}>Картадан таңдау</Text>
      </TouchableOpacity>
      {homeLat && homeLng ? (
        <Text style={styles.mapHint}>
          Таңдалды: {homeLat}, {homeLng}
        </Text>
      ) : null}
      {role === 'CARRIER' ? (
        <>
          <Text style={styles.label}>Көлік мүмкіндігі</Text>
          <TextInput
            style={styles.input}
            value={maxWeightKg}
            onChangeText={setMaxWeightKg}
            placeholder="Max салмақ (кг)"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={maxVolumeM3}
            onChangeText={setMaxVolumeM3}
            placeholder="Max көлем (м3, міндетті емес)"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={vehicleType}
            onChangeText={setVehicleType}
            placeholder="Vehicle type (GAZELLE/TRUCK/BIG_TRUCK)"
            placeholderTextColor={theme.colors.placeholder}
          />
          <View style={styles.flagRow}>
            <Text style={styles.label}>Тоңазытқыш</Text>
            <Switch value={refrigerated} onValueChange={setRefrigerated} />
          </View>
          <View style={styles.flagRow}>
            <Text style={styles.label}>Мал тасымалы</Text>
            <Switch value={livestockAllowed} onValueChange={setLivestockAllowed} />
          </View>
          <View style={styles.flagRow}>
            <Text style={styles.label}>Жабық кузов</Text>
            <Switch value={closedBody} onValueChange={setClosedBody} />
          </View>
        </>
      ) : null}
      <TouchableOpacity style={styles.button} onPress={onRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Тіркелу...' : 'Тіркелу'}</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Аккаунт бар ма? </Text>
        <Link href="/(auth)/login" style={styles.link}>
          Кіру
        </Link>
      </View>
      <MapPicker
        visible={showMapPicker}
        title="Үй мекенжайы"
        initialLat={homeLat ? Number(homeLat) : undefined}
        initialLng={homeLng ? Number(homeLng) : undefined}
        onPick={(coords) => {
          setHomeLat(coords.lat.toFixed(6));
          setHomeLng(coords.lng.toFixed(6));
        }}
        onClose={() => setShowMapPicker(false)}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
