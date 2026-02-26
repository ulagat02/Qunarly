import { useEffect, useState } from 'react';
import {
  Alert,
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
import * as ImagePicker from 'expo-image-picker';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useUserProfile } from '@/src/mobile/store/userProfile';

const categories = [
  { value: 'GRAIN', label: 'Астық' },
  { value: 'VEGETABLE', label: 'Көкөніс' },
  { value: 'FRUIT', label: 'Жеміс' },
  { value: 'OILSEED', label: 'Майлы дақыл' },
  { value: 'DAIRY', label: 'Сүт өнімдері' },
  { value: 'MEAT', label: 'Ет' },
  { value: 'OTHER', label: 'Басқа' },
];
const units = ['кг', 'т', 'л', 'дана'];

export default function CreateListingScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('кг');
  const [price, setPrice] = useState('');
  const [rawPrice, setRawPrice] = useState('');
  const [addressText, setAddressText] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const { profile } = useUserProfile();

  useEffect(() => {
    if (profile?.addressText && !addressText) {
      setAddressText(profile.addressText);
    }
    if (profile?.lat && !lat) {
      setLat(String(profile.lat));
    }
    if (profile?.lng && !lng) {
      setLng(String(profile.lng));
    }
  }, [profile, addressText, lat, lng]);

  const toDigitsOnly = (value: string) => value.replace(/[^\d]/g, '');
  const formatPrice = (value: string) =>
    value ? value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Қате', 'Галереяға рұқсат қажет.');
      return;
    }
    const imageMedia =
      (ImagePicker as any).MediaType?.Images ?? ImagePicker.MediaTypeOptions.Images;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMedia,
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets?.length) {
      setImages(result.assets);
    }
  };

  const onCreate = async () => {
    if (!profile?.lat || !profile?.lng || !profile?.addressText) {
      Alert.alert('Қате', 'Алдымен профилде мекенжайды белгілеңіз.');
      return;
    }
    const resolvedAddress = addressText || profile.addressText || '';
    const resolvedLat = lat ? Number(lat) : profile.lat;
    const resolvedLng = lng ? Number(lng) : profile.lng;
    if (!title || !quantity || !rawPrice || !resolvedAddress || !category) {
      Alert.alert('Қате', 'Атауы, көлемі, бағасы, мекенжайы және санат міндетті.');
      return;
    }
    if (category === 'OTHER' && !customCategoryName) {
      Alert.alert('Қате', 'Санат атауын енгізіңіз.');
      return;
    }
    setLoading(true);
    try {
      const listingResponse = await api.post('/market/listings', {
        title,
        description: description || undefined,
        category,
        customCategoryName: category === 'OTHER' ? customCategoryName : undefined,
        quantity: Number(quantity),
        unit,
        price: Number(rawPrice),
        currency: 'KZT',
        addressText: resolvedAddress,
        lat: resolvedLat ?? undefined,
        lng: resolvedLng ?? undefined,
      });
      const listingId = listingResponse.data?.id;
      if (listingId && images.length) {
        const formData = new FormData();
        images.forEach((asset) => {
          formData.append('files', {
            uri: asset.uri,
            name: asset.fileName ?? 'listing.jpg',
            type: asset.mimeType ?? 'image/jpeg',
          } as any);
        });
        try {
          await api.post(`/market/listings/${listingId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (error: any) {
          const info = parseApiError(error);
          Alert.alert('Қате', info.message);
        }
      }
      Alert.alert('Сәтті', 'Жарияланым қосылды.');
      setTitle('');
      setDescription('');
      setQuantity('');
      setPrice('');
      setRawPrice('');
      setCategory('');
      setCustomCategoryName('');
      setLat('');
      setLng('');
      setImages([]);
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
      <Text style={styles.title}>Жаңа жарияланым</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Атауы"
      />
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Сипаттама"
      />
      <Text style={styles.label}>Санат</Text>
      <View style={styles.categoryRow}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.categoryButton, category === item.value && styles.categoryActive]}
            onPress={() => setCategory(item.value)}
          >
            <Text style={[styles.categoryText, category === item.value && styles.categoryTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {category === 'OTHER' ? (
        <TextInput
          style={styles.input}
          value={customCategoryName}
          onChangeText={setCustomCategoryName}
          placeholder="Санат атауы"
        />
      ) : null}
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={(value) => setQuantity(toDigitsOnly(value))}
        placeholder="Көлемі"
        keyboardType="numeric"
      />
      <Text style={styles.label}>Өлшем бірлігі</Text>
      <View style={styles.categoryRow}>
        {units.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.categoryButton, unit === item && styles.categoryActive]}
            onPress={() => setUnit(item)}
          >
            <Text style={[styles.categoryText, unit === item && styles.categoryTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={formatPrice(rawPrice)}
        onChangeText={(value) => setRawPrice(toDigitsOnly(value))}
        placeholder="Бағасы (KZT)"
        keyboardType="numeric"
      />
      <Text style={styles.label}>Мекенжай</Text>
      <TextInput
        style={styles.input}
        value={addressText}
        onChangeText={setAddressText}
        placeholder="Мекенжай"
      />
      {lat && lng ? <Text style={styles.mapHint}>Таңдалды: {lat}, {lng}</Text> : null}
      <View style={styles.imageBlock}>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImages}>
          <Text style={styles.secondaryText}>
            {images.length ? `Суреттер: ${images.length}` : 'Сурет таңдау'}
          </Text>
        </TouchableOpacity>
        {images.length ? (
          <View style={styles.previewRow}>
            {images.map((asset) => (
              <Image key={asset.uri} source={{ uri: asset.uri }} style={styles.previewImage} />
            ))}
          </View>
        ) : null}
      </View>
      <TouchableOpacity style={styles.button} onPress={onCreate} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Жіберілуде...' : 'Қосу'}</Text>
      </TouchableOpacity>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  categoryActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
  },
  categoryTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  imageBlock: {
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  mapHint: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
