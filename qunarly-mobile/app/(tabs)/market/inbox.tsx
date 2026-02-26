import { useEffect, useState } from 'react';
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
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';

type Listing = {
  id: string;
  title: string;
  sellerId: string;
};

type Offer = {
  id: string;
  price: number;
  quantity: number;
  message?: string | null;
  status: string;
};

export default function InboxScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [offersByListing, setOffersByListing] = useState<Record<string, Offer[]>>({});
  const [counterPrice, setCounterPrice] = useState<Record<string, string>>({});
  const [counterQuantity, setCounterQuantity] = useState<Record<string, string>>({});
  const [counterMessage, setCounterMessage] = useState<Record<string, string>>({});

  const loadOffers = async () => {
    const session = await getSession();
    if (!session.userId) return;

    try {
      const listingResponse = await api.get('/market/listings');
      const mine = (listingResponse.data ?? []).filter(
        (item: Listing) => item.sellerId === session.userId,
      );
      setListings(mine);

      const offerMap: Record<string, Offer[]> = {};
      for (const listing of mine) {
        const offersResponse = await api.get(`/market/listings/${listing.id}/offers`);
        offerMap[listing.id] = offersResponse.data ?? [];
      }
      setOffersByListing(offerMap);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Ұсыныстарды жүктеу мүмкін болмады.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const acceptOffer = async (offerId: string) => {
    try {
      await api.post(`/market/offers/${offerId}/accept`);
      Alert.alert('Сәтті', 'Ұсыныс қабылданды.');
      loadOffers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Қате болды.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  const rejectOffer = async (offerId: string) => {
    try {
      await api.post(`/market/offers/${offerId}/reject`);
      Alert.alert('Сәтті', 'Ұсыныс қабылданбады.');
      loadOffers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Қате болды.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  const counterOffer = async (offer: Offer) => {
    try {
      await api.post(`/market/offers/${offer.id}/counter`, {
        price: Number(counterPrice[offer.id] ?? offer.price),
        quantity: Number(counterQuantity[offer.id] ?? offer.quantity),
        message: counterMessage[offer.id] || undefined,
      });
      Alert.alert('Сәтті', 'Қарсы ұсыныс жіберілді.');
      loadOffers();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Қате болды.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'PENDING':
        return 'Күтуде';
      case 'ACCEPTED':
        return 'Қабылданды';
      case 'REJECTED':
        return 'Қабылданбады';
      case 'COUNTERED':
        return 'Қарсы ұсыныс';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'PENDING':
        return '#FF9800';
      case 'ACCEPTED':
        return '#2E7D32';
      case 'REJECTED':
        return '#D32F2F';
      case 'COUNTERED':
        return '#1976D2';
      default:
        return '#666';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Ұсыныстар</Text>
      {listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Ұсыныс жоқ</Text>
        </View>
      ) : (
        listings.map((listing) => (
          <View key={listing.id} style={styles.listingBlock}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            {(offersByListing[listing.id] ?? []).length === 0 ? (
              <Text style={styles.noOffers}>Бұл жарияланымға ұсыныс жоқ</Text>
            ) : (
              (offersByListing[listing.id] ?? []).map((offer) => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <View style={styles.offerInfo}>
                      <Text style={styles.offerPrice}>
                        {(offer.unitPrice ?? offer.price ?? 0).toLocaleString('kk-KZ')} ₸
                      </Text>
                      <Text style={styles.offerQuantity}>
                        {offer.quantity} бірлік
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(offer.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(offer.status) }]}
                      >
                        {getStatusLabel(offer.status)}
                      </Text>
                    </View>
                  </View>
                  {offer.message ? (
                    <Text style={styles.offerMessage}>{offer.message}</Text>
                  ) : null}
                  {offer.status === 'SENT' || offer.status === 'COUNTERED' ? (
                    <View style={styles.actionsSection}>
                      <Text style={styles.counterTitle}>Қарсы ұсыныс:</Text>
                      <TextInput
                        style={styles.input}
                        defaultValue={String(offer.unitPrice ?? offer.price ?? '')}
                        onChangeText={(value) => setCounterPrice((prev) => ({ ...prev, [offer.id]: value }))}
                        placeholder="Қарсы баға"
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={styles.input}
                        defaultValue={String(offer.quantity)}
                        onChangeText={(value) =>
                          setCounterQuantity((prev) => ({ ...prev, [offer.id]: value }))
                        }
                        placeholder="Қарсы көлем"
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={styles.input}
                        onChangeText={(value) => setCounterMessage((prev) => ({ ...prev, [offer.id]: value }))}
                        placeholder="Хабарлама (міндетті емес)"
                        multiline
                      />
                      <View style={styles.row}>
                        <TouchableOpacity
                          style={styles.primaryButton}
                          onPress={() => acceptOffer(offer.id)}
                        >
                          <Text style={styles.buttonText}>Қабылдау</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => rejectOffer(offer.id)}
                        >
                          <Text style={styles.rejectText}>Қабылдамау</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => counterOffer(offer)}
                        >
                          <Text style={styles.counterText}>Қарсы</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ))
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1B5E20',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  empty: {
    color: '#999',
    fontSize: 16,
  },
  listingBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1B5E20',
  },
  noOffers: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  offerCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerInfo: {
    flex: 1,
  },
  offerPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  offerQuantity: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  offerMessage: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  actionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  counterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: '#D32F2F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
  },
  rejectText: {
    color: '#D32F2F',
    fontWeight: '600',
    textAlign: 'center',
  },
  counterButton: {
    borderWidth: 1,
    borderColor: '#1976D2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
  },
  counterText: {
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
  },
});
