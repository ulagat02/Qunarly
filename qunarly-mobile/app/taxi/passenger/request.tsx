import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { useTheme } from '@/src/mobile/theme';

export default function PassengerRequestScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeId = typeof params.routeId === 'string' ? params.routeId : null;

  const [pickupText, setPickupText] = useState('');
  const [pickupMode, setPickupMode] = useState<'preset' | 'custom'>('preset');
  const [seats, setSeats] = useState('1');
  const [cargoType, setCargoType] = useState<'NONE' | 'SMALL' | 'LARGE'>('NONE');

  const seatsNumber = Number(seats);
  const isReady =
    !!routeId && pickupText.trim().length > 0 && Number.isFinite(seatsNumber) && seatsNumber >= 1 && seatsNumber <= 8;

  const handleCreateRequest = async () => {
    if (!routeId) return;
    if (!isReady) {
      Alert.alert('Қате', 'Барлық өрісті толтырыңыз.');
      return;
    }
    try {
      const response = await api.post('/taxi/requests', {
        routeId,
        pickupText: pickupText.trim(),
        seats: seatsNumber,
        cargoType,
        departureType: 'TODAY',
        waitUntilFull: false,
      });
      const requestId = response.data?.id;
      if (requestId) {
        Alert.alert('Тапсырыс кетті', 'Қабылдауды күтіңіз.');
        router.replace({ pathname: '/taxi/passenger/wait', params: { requestId } });
      }
    } catch (error) {
      Alert.alert('Қате', 'Сұраныс жіберілмеді');
    }
  };

  const presetPickup = useMemo(
    () => ['Дүкен қасы', 'Мешіт алды', 'Мектеп маңы', 'Үйім', 'Басқа'],
    [],
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={[styles.card, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Тапсырыс мәліметі</Text>
        <Text style={styles.helperText}>Кездесу орны</Text>
        <View style={styles.optionRow}>
          {presetPickup.map((label) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.optionButton,
                {
                  backgroundColor: pickupText === label ? '#DCFCE7' : '#F3F4F6',
                  borderColor: pickupText === label ? '#22C55E' : '#E5E7EB',
                },
              ]}
              onPress={() => {
                if (label === 'Басқа') {
                  setPickupMode('custom');
                  setPickupText('');
                } else {
                  setPickupMode('preset');
                  setPickupText(label);
                }
              }}
            >
              <Text style={{ color: pickupText === label ? '#166534' : '#374151' }}>
                {pickupText === label ? `✓ ${label}` : label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {pickupMode === 'custom' ? (
          <TextInput
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Кездесу орны (толық)"
            placeholderTextColor={theme.colors.placeholder}
            value={pickupText}
            onChangeText={setPickupText}
          />
        ) : null}
        <Text style={styles.helperText}>Қанша адам барады?</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Адам саны"
          placeholderTextColor={theme.colors.placeholder}
          value={seats}
          onChangeText={setSeats}
          keyboardType="number-pad"
        />
        <Text style={styles.helperText}>Жүк</Text>
        <View style={styles.optionRow}>
          {([
            { value: 'NONE', label: 'Жүк жоқ' },
            { value: 'SMALL', label: 'Жүк бар' },
            { value: 'LARGE', label: 'Үлкен жүк' },
          ] as const).map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.optionButton,
                {
                  backgroundColor: cargoType === item.value ? '#DCFCE7' : '#F3F4F6',
                  borderColor: cargoType === item.value ? '#22C55E' : '#E5E7EB',
                },
              ]}
              onPress={() => setCargoType(item.value)}
            >
              <Text style={{ color: cargoType === item.value ? '#166534' : '#374151' }}>
                {cargoType === item.value ? `✓ ${item.label}` : item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isReady ? theme.colors.primary : theme.colors.border },
          ]}
          onPress={handleCreateRequest}
          disabled={!isReady}
        >
          <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Сұраныс жіберу</Text>
        </TouchableOpacity>
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
    gap: 10,
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
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
