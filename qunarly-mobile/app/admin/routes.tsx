import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/mobile/theme';
import MapPinPicker from '@/src/mobile/components/MapPinPicker';
import api from '@/lib/api/client';

export default function AdminRoutesScreen() {
  const { theme } = useTheme();
  const [hubA, setHubA] = useState({ name: '', lat: 0, lng: 0, radius: '800' });
  const [hubB, setHubB] = useState({ name: '', lat: 0, lng: 0, radius: '800' });
  const [pickingFor, setPickingFor] = useState<'A' | 'B' | null>(null);

  const handlePick = (coords: { lat: number; lng: number }) => {
    if (pickingFor === 'A') {
      setHubA({ ...hubA, lat: coords.lat, lng: coords.lng });
    } else {
      setHubB({ ...hubB, lat: coords.lat, lng: coords.lng });
    }
    setPickingFor(null);
  };

  const handleSave = async () => {
    if (!hubA.name || !hubA.lat || !hubB.name || !hubB.lat) {
      Alert.alert('Қате', 'Барлық өрістерді толтырыңыз');
      return;
    }

    try {
      // 1. Create Hub A
      const resA = await api.post('/hubs', {
        name: hubA.name,
        lat: hubA.lat,
        lng: hubA.lng,
        radiusMeters: Number(hubA.radius),
      });

      // 2. Create Hub B
      const resB = await api.post('/hubs', {
        name: hubB.name,
        lat: hubB.lat,
        lng: hubB.lng,
        radiusMeters: Number(hubB.radius),
      });

      // 3. Create Route
      await api.post('/routes', {
        fromHubId: resA.data.id,
        toHubId: resB.data.id,
        scheduleType: 'QUEUE',
      });

      Alert.alert('Сәтті', 'Маршрут және хабтар жасалды');
    } catch (error) {
      Alert.alert('Қате', 'Сақтау мүмкін болмады');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Жаңа маршрут (Admin)</Text>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.label}>A нүктесі (Хаб)</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Хаб атауы (мыс: Шелек)"
          value={hubA.name}
          onChangeText={(t) => setHubA({ ...hubA, name: t })}
        />
        <TouchableOpacity
          style={[styles.pickButton, { borderColor: theme.colors.primary }]}
          onPress={() => setPickingFor('A')}
        >
          <Text style={{ color: theme.colors.primary }}>
            {hubA.lat ? `${hubA.lat.toFixed(4)}, ${hubA.lng.toFixed(4)}` : 'Картадан таңдау'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={styles.label}>B нүктесі (Хаб)</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Хаб атауы (мыс: Алматы Саяхат)"
          value={hubB.name}
          onChangeText={(t) => setHubB({ ...hubB, name: t })}
        />
        <TouchableOpacity
          style={[styles.pickButton, { borderColor: theme.colors.primary }]}
          onPress={() => setPickingFor('B')}
        >
          <Text style={{ color: theme.colors.primary }}>
            {hubB.lat ? `${hubB.lat.toFixed(4)}, ${hubB.lng.toFixed(4)}` : 'Картадан таңдау'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSave}
      >
        <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>Сақтау</Text>
      </TouchableOpacity>

      <MapPinPicker
        visible={!!pickingFor}
        title={`${pickingFor} нүктесін таңдаңыз`}
        onPick={handlePick}
        onClose={() => setPickingFor(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  pickButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
});
