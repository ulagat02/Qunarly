import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ImageViewing from 'react-native-image-viewing';
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import { useTheme } from '@/src/mobile/theme';
import { useUserProfile } from '@/src/mobile/store/userProfile';

type Listing = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  regionId?: string | null;
  addressText?: string | null;
  status: string;
  sellerId: string;
  imageUrls?: string[];
};

const generateIdempotencyKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [order, setOrder] = useState<any | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { profile } = useUserProfile();

  const viewerImages = useMemo(
    () => (listing?.imageUrls ?? []).map((url) => ({ uri: url })),
    [listing?.imageUrls],
  );

  const screenWidth = Dimensions.get('window').width;
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        container: {
          flexGrow: 1,
          backgroundColor: theme.colors.background,
        },
        gallery: {
          height: 240,
          marginBottom: 0,
        },
        galleryImage: {
          width: '100%',
          minHeight: 220,
          height: 240,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
        },
        galleryPlaceholder: {
          minHeight: 220,
          height: 240,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        galleryPlaceholderText: {
          fontSize: 64,
          color: theme.colors.mutedText,
        },
        viewerHeader: {
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          paddingTop: Platform.OS === 'ios' ? 48 : 24,
          paddingHorizontal: 16,
          alignItems: 'flex-end',
        },
        viewerClose: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.55)',
        },
        viewerCloseText: {
          color: '#fff',
          fontSize: 26,
          lineHeight: 26,
          marginTop: -2,
        },
        content: {
          backgroundColor: theme.colors.surface,
          padding: 16,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginTop: -20,
        },
        title: {
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 12,
          color: theme.colors.text,
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        price: {
          fontSize: 28,
          fontWeight: '700',
          color: theme.colors.primary,
        },
        categoryBadge: {
          backgroundColor: theme.colors.background,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 16,
        },
        categoryText: {
          fontSize: 12,
          color: theme.colors.primary,
          fontWeight: '600',
        },
        infoSection: {
          marginBottom: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        infoRow: {
          flexDirection: 'row',
          marginBottom: 10,
        },
        infoLabel: {
          fontSize: 14,
          color: theme.colors.mutedText,
          marginRight: 8,
          minWidth: 80,
        },
        infoValue: {
          fontSize: 14,
          color: theme.colors.text,
          fontWeight: '500',
          flex: 1,
        },
        descriptionSection: {
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        descriptionTitle: {
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 8,
          color: theme.colors.text,
        },
        descriptionText: {
          fontSize: 14,
          color: theme.colors.mutedText,
          lineHeight: 20,
        },
        section: {
          marginTop: 20,
          paddingHorizontal: 16,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 8,
          color: theme.colors.text,
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        },
        button: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
        },
        buttonText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        secondaryButton: {
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center',
        },
        secondaryText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        orderCard: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          padding: 12,
          backgroundColor: theme.colors.surface,
          marginTop: 8,
        },
        orderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        },
        orderLabel: {
          color: theme.colors.mutedText,
        },
        orderValue: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        legRow: {
          marginTop: 6,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        primaryButton: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 10,
        },
        quantityRow: {
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          marginTop: 10,
        },
        quantityInput: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 10,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        },
        updateButton: {
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
        },
        updateText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const loadListing = async () => {
    try {
      const response = await api.get(`/market/listings/${id}`);
      setListing(response.data);
    } catch (error) {
      Alert.alert('Қате', 'Жарияланымды жүктеу мүмкін болмады.');
    }
  };

  useEffect(() => {
    getSession().then((session) => {
      setRole(session.role);
      setUserId(session.userId);
    });
    loadListing();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await api.get('/orders/my', { params: { listingId: id } });
      const latest = Array.isArray(response.data) ? response.data[0] : null;
      setOrder(latest ?? null);
    } catch (error) {
      setOrder(null);
    }
  };

  useEffect(() => {
    if (role === 'BUYER') {
      loadOrder();
    }
  }, [role, id]);

  const makeOffer = async () => {
    try {
      await api.post(`/market/listings/${id}/offers`, {
        price: Number(offerPrice),
        quantity: Number(offerQuantity),
        message: offerMessage || undefined,
      });
      Alert.alert('Жіберілді', 'Ұсыныс жіберілді.');
      setOfferPrice('');
      setOfferQuantity('');
      setOfferMessage('');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Ұсыныс жіберілмеді.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  const placeOrder = async () => {
    if (!profile?.lat || !profile?.lng || !profile?.addressText) {
      Alert.alert('Қате', 'Алдымен профилде мекенжайды белгілеңіз.');
      return;
    }
    if (!orderQuantity || isNaN(Number(orderQuantity))) {
      Alert.alert('Қате', 'Дұрыс көлем енгізіңіз.');
      return;
    }
    if (listing && Number(orderQuantity) > listing.quantity) {
      Alert.alert('Қате', `Қолжетімді көлем: ${listing.quantity} ${listing.unit}`);
      return;
    }
    if (!destinationText.trim()) {
      Alert.alert('Қате', 'Жеткізу мекенжайын енгізіңіз.');
      return;
    }
    setOrderLoading(true);
    try {
      await api.post('/orders', {
        listingId: id,
        quantity: Number(orderQuantity),
        idempotencyKey,
        destinationText: destinationText.trim(),
      });
      Alert.alert('Сәтті', 'Тапсырыс құрылды.');
      setOrderQuantity('');
      setDestinationText('');
      setIdempotencyKey(generateIdempotencyKey());
      await loadOrder();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Тапсырыс құру мүмкін болмады.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    } finally {
      setOrderLoading(false);
    }
  };

  const [editingQuantity, setEditingQuantity] = useState('');

  const pauseListing = async () => {
    try {
      await api.patch(`/market/listings/${id}`, { status: 'PAUSED' });
      Alert.alert('Жаңартылды', 'Жарияланым уақытша тоқтатылды.');
      loadListing();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Жаңарту мүмкін болмады.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  const resumeListing = async () => {
    try {
      await api.patch(`/market/listings/${id}`, { status: 'PUBLISHED' });
      Alert.alert('Жаңартылды', 'Жарияланым қайта қосылды.');
      loadListing();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Жаңарту мүмкін болмады.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  const updateQuantity = async () => {
    if (!editingQuantity || isNaN(Number(editingQuantity))) {
      Alert.alert('Қате', 'Дұрыс көлем енгізіңіз.');
      return;
    }
    try {
      await api.patch(`/market/listings/${id}`, { quantity: Number(editingQuantity) });
      Alert.alert('Жаңартылды', 'Көлем жаңартылды.');
      setEditingQuantity('');
      loadListing();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? error?.message ?? 'Жаңарту мүмкін болмады.';
      Alert.alert('Қате', Array.isArray(message) ? message.join('\n') : message);
    }
  };

  if (!listing) {
    return (
      <View style={styles.container}>
        <Text style={{ color: theme.colors.text }}>Жүктелуде...</Text>
      </View>
    );
  }

  const isOwner = userId && listing.sellerId === userId;

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {listing.imageUrls?.length ? (
        <FlatList
          data={listing.imageUrls}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(url, index) => `${url}-${index}`}
          renderItem={({ item: url, index }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setViewerIndex(index);
                setViewerVisible(true);
              }}
              style={{ width: screenWidth }}
            >
              <Image source={{ uri: url }} style={styles.galleryImage} />
            </TouchableOpacity>
          )}
          style={styles.gallery}
        />
      ) : (
        <View style={styles.galleryPlaceholder}>
          <Text style={styles.galleryPlaceholderText}>📷</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{listing.title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {listing.price.toLocaleString('kk-KZ')} {listing.currency}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{listing.category}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Көлемі:</Text>
            <Text style={styles.infoValue}>
              {listing.quantity} {listing.unit}
            </Text>
          </View>
          {listing.regionId ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Аймақ:</Text>
              <Text style={styles.infoValue}>{listing.regionId}</Text>
            </View>
          ) : null}
          {listing.addressText ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Мекенжай:</Text>
              <Text style={styles.infoValue}>{listing.addressText}</Text>
            </View>
          ) : null}
        </View>

        {listing.description ? (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Сипаттама</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>
        ) : null}
      </View>

      {role === 'BUYER' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ұсыныс жасау</Text>
          <TextInput
            style={styles.input}
            value={offerPrice}
            onChangeText={setOfferPrice}
            placeholder="Баға"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={offerQuantity}
            onChangeText={setOfferQuantity}
            placeholder="Көлемі"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={offerMessage}
            onChangeText={setOfferMessage}
            placeholder="Хабарлама (қаласаңыз)"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TouchableOpacity style={styles.button} onPress={makeOffer}>
            <Text style={styles.buttonText}>Ұсыныс жіберу</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {role === 'BUYER' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тапсырыс</Text>
          <TextInput
            style={styles.input}
            value={destinationText}
            onChangeText={setDestinationText}
            placeholder="Жеткізу мекенжайы"
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={orderQuantity}
            onChangeText={setOrderQuantity}
            placeholder="Көлемі"
            placeholderTextColor={theme.colors.placeholder}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={placeOrder} disabled={orderLoading}>
            <Text style={styles.buttonText}>{orderLoading ? 'Жүктелуде...' : 'Тапсырыс беру'}</Text>
          </TouchableOpacity>
          {order ? (
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Статус:</Text>
                <Text style={styles.orderValue}>{order.status}</Text>
              </View>
              {order.currentLeg ? (
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>Қазір:</Text>
                  <Text style={styles.orderValue}>
                    {order.currentLeg.fromLocation} → {order.currentLeg.toLocation}
                  </Text>
                </View>
              ) : null}
              {(order.legs ?? []).map((leg: any) => (
                <View key={leg.id} style={styles.legRow}>
                  <Text style={styles.orderLabel}>
                    {leg.fromLocation} → {leg.toLocation}
                  </Text>
                  <Text style={styles.orderValue}>{leg.status}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {role === 'FARMER' && isOwner ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Басқару</Text>
          {listing.status === 'PUBLISHED' ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={pauseListing}>
              <Text style={styles.secondaryText}>Уақытша тоқтату</Text>
            </TouchableOpacity>
          ) : listing.status === 'PAUSED' ? (
            <TouchableOpacity style={styles.primaryButton} onPress={resumeListing}>
              <Text style={styles.buttonText}>Қайта қосу</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.quantityRow}>
            <TextInput
              style={styles.quantityInput}
              value={editingQuantity}
              onChangeText={setEditingQuantity}
              placeholder={`Көлем (қазір: ${listing.quantity})`}
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.updateButton} onPress={updateQuantity}>
              <Text style={styles.updateText}>Көлемді жаңарту</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      </ScrollView>
      <ImageViewing
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        presentationStyle="overFullScreen"
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        backgroundColor="rgba(0,0,0,0.95)"
        onRequestClose={() => setViewerVisible(false)}
        HeaderComponent={() => (
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              style={styles.viewerClose}
              onPress={() => setViewerVisible(false)}
            >
              <Text style={styles.viewerCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

