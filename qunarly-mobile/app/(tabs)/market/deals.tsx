import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { getSession } from '@/lib/auth/session';

type Deal = {
  id: string;
  status: string;
  listing?: {
    id: string;
    title: string;
  };
  offer?: {
    price: number;
    quantity: number;
    message?: string | null;
  };
  sellerId: string;
  buyerId: string;
};

export default function DealsScreen() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const loadDeals = async () => {
    try {
      const response = await api.get('/market/deals');
      setDeals(response.data ?? []);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  useEffect(() => {
    getSession().then((session) => setUserId(session.userId));
    loadDeals();
  }, []);

  const confirmDeal = async (dealId: string) => {
    try {
      await api.post(`/market/deals/${dealId}/confirm`);
      Alert.alert('Сәтті', 'Келісім бекітілді.');
      loadDeals();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NEGOTIATING':
        return 'Келіссөз';
      case 'CONFIRMED':
        return 'Бекітілген';
      case 'IN_DELIVERY':
        return 'Жеткізуде';
      case 'DELIVERED':
        return 'Жеткізілді';
      case 'CLOSED':
        return 'Жабылды';
      case 'CANCELLED':
        return 'Бас тартылған';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Келісімдер жоқ</Text>}
        renderItem={({ item }) => {
          const isOwner = userId === item.sellerId || userId === item.buyerId;
          const canConfirm = item.status === 'NEGOTIATING' && isOwner;
          const isSeller = userId === item.sellerId;
          const isBuyer = userId === item.buyerId;
          return (
            <View style={styles.card}>
              <Link
                href={{ pathname: '/(tabs)/market/details/[id]', params: { id: item.listing?.id ?? '' } }}
                asChild
              >
                <TouchableOpacity>
                  <Text style={styles.cardTitle}>{item.listing?.title ?? 'Келісім'}</Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            item.status === 'NEGOTIATING'
                              ? '#FF980020'
                              : item.status === 'CONFIRMED'
                              ? '#2E7D3220'
                              : item.status === 'IN_DELIVERY' || item.status === 'DELIVERED'
                              ? '#2563EB20'
                              : '#D32F2F20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              item.status === 'NEGOTIATING'
                                ? '#FF9800'
                                : item.status === 'CONFIRMED'
                                ? '#2E7D32'
                                : item.status === 'IN_DELIVERY' || item.status === 'DELIVERED'
                                ? '#2563EB'
                                : '#D32F2F',
                          },
                        ]}
                      >
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                    <Text style={styles.roleLabel}>
                      {isSeller ? 'Сатушы' : isBuyer ? 'Сатып алушы' : ''}
                    </Text>
                  </View>
                  {item.offer ? (
                    <View style={styles.offerSection}>
                      <View style={styles.offerRow}>
                        <Text style={styles.offerLabel}>Баға:</Text>
                        <Text style={styles.offerValue}>
                          {item.offer.price.toLocaleString('kk-KZ')} ₸
                        </Text>
                      </View>
                      <View style={styles.offerRow}>
                        <Text style={styles.offerLabel}>Көлемі:</Text>
                        <Text style={styles.offerValue}>{item.offer.quantity} бірлік</Text>
                      </View>
                      {item.offer.message ? (
                        <View style={styles.messageBox}>
                          <Text style={styles.messageLabel}>Хабарлама:</Text>
                          <Text style={styles.messageText}>{item.offer.message}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </TouchableOpacity>
              </Link>
              {canConfirm ? (
                <TouchableOpacity style={styles.confirmButton} onPress={() => confirmDeal(item.id)}>
                  <Text style={styles.confirmText}>Бекіту</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  empty: {
    color: '#999',
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1B5E20',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roleLabel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  offerSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  offerLabel: {
    fontSize: 14,
    color: '#666',
  },
  offerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  messageBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
