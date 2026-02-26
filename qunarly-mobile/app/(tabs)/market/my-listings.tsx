import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import { parseApiError } from '@/lib/api/errors';

type Listing = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  sellerId: string;
  status: string;
};

export default function MyListingsScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<Record<string, string>>({});

  const loadListings = async (id: string) => {
    try {
      const response = await api.get('/market/listings');
      const all = response.data ?? [];
      setListings(all.filter((item: Listing) => item.sellerId === id));
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  useEffect(() => {
    getSession().then((session) => {
      setUserId(session.userId);
      if (session.userId) {
        loadListings(session.userId);
      }
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/market/listings/${id}`, { status });
      Alert.alert('Сәтті', 'Жарияланым жаңартылды.');
      if (userId) loadListings(userId);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const updateQuantity = async (id: string) => {
    const newQty = editingQuantity[id];
    if (!newQty || isNaN(Number(newQty))) {
      Alert.alert('Қате', 'Дұрыс көлем енгізіңіз.');
      return;
    }
    try {
      await api.patch(`/market/listings/${id}`, { quantity: Number(newQty) });
      Alert.alert('Сәтті', 'Көлем жаңартылды.');
      setEditingQuantity((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (userId) loadListings(userId);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'Белсенді';
      case 'PAUSED':
        return 'Тоқтатылған';
      case 'CLOSED':
        return 'Жабылған';
      default:
        return status;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Жарияланым жоқ</Text>}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Link href={{ pathname: '/(tabs)/market/details/[id]', params: { id: item.id } }} asChild>
              <TouchableOpacity>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardText}>
                  Көлемі: {item.quantity} {item.unit}
                </Text>
                <Text style={styles.cardText}>
                  Баға: {item.price} {item.currency}
                </Text>
                <Text style={[styles.cardText, styles.status]}>
                  Статус: {getStatusLabel(item.status)}
                </Text>
              </TouchableOpacity>
            </Link>
            <View style={styles.actions}>
              {item.status === 'PUBLISHED' ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => updateStatus(item.id, 'PAUSED')}
                >
                  <Text style={styles.secondaryText}>Тоқтату</Text>
                </TouchableOpacity>
              ) : item.status === 'PAUSED' ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => updateStatus(item.id, 'PUBLISHED')}
                >
                  <Text style={styles.buttonText}>Қайта қосу</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.quantityRow}>
                <TextInput
                  style={styles.quantityInput}
                  value={editingQuantity[item.id] ?? String(item.quantity)}
                  onChangeText={(value) =>
                    setEditingQuantity((prev) => ({ ...prev, [item.id]: value }))
                  }
                  placeholder="Көлем"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => updateQuantity(item.id)}
                >
                  <Text style={styles.updateText}>Жаңарту</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
      {!userId ? <Text style={styles.empty}>Кіру қажет</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  empty: {
    color: '#777',
    marginTop: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardText: {
    color: '#333',
  },
  status: {
    fontWeight: '600',
    color: '#2E7D32',
  },
  actions: {
    marginTop: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    padding: 8,
  },
  updateButton: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  updateText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
});
