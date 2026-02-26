import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ImageViewing from 'react-native-image-viewing';
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import BottomSheetSelect, { SelectOption } from '@/src/mobile/components/BottomSheetSelect';
import { useTheme } from '@/src/mobile/theme';
import FloatingActionButton from '@/src/mobile/components/FloatingActionButton';
import { PriceTagIcon } from '@/src/mobile/components/AppIcons';

type Listing = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  regionId?: string | null;
  category: string;
  coverImageUrl?: string | null;
  seller?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
};


const categories = [
  { value: '', label: 'Барлығы' },
  { value: 'GRAIN', label: 'Астық' },
  { value: 'VEGETABLE', label: 'Көкөніс' },
  { value: 'FRUIT', label: 'Жеміс' },
  { value: 'OILSEED', label: 'Майлы дақыл' },
  { value: 'DAIRY', label: 'Сүт өнімдері' },
  { value: 'MEAT', label: 'Ет' },
  { value: 'OTHER', label: 'Басқа' },
];

export default function MarketFeedScreen() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<'latest' | 'price_asc' | 'price_desc'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [regions, setRegions] = useState<SelectOption[]>([]);
  const [districts, setDistricts] = useState<SelectOption[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<SelectOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<SelectOption | null>(null);
  const [showRegionSheet, setShowRegionSheet] = useState(false);
  const [showDistrictSheet, setShowDistrictSheet] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const viewerImages = useMemo(() => (viewerImage ? [{ uri: viewerImage }] : []), [viewerImage]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        listContent: {
          padding: 16,
          paddingBottom: 120,
        },
        empty: {
          textAlign: 'center',
          color: theme.colors.mutedText,
          marginTop: 20,
        },
        emptyContainer: {
          alignItems: 'center',
          gap: 6,
          marginTop: 20,
        },
        emptyTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
        },
        emptyText: {
          fontSize: 13,
          color: theme.colors.mutedText,
          textAlign: 'center',
        },
        topActions: {
          marginBottom: 12,
        },
        actionPill: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 20,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginRight: 8,
        },
        actionPillText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 10,
          marginBottom: 12,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        },
        filterToggle: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 10,
        },
        filterToggleText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        resultsCount: {
          color: theme.colors.mutedText,
          marginBottom: 12,
        },
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          marginBottom: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        cardImage: {
          width: '100%',
          minHeight: 220,
          height: 240,
          backgroundColor: theme.colors.surface,
        },
        cardImagePlaceholder: {
          width: '100%',
          minHeight: 220,
          height: 240,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cardImagePlaceholderText: {
          fontSize: 48,
          color: theme.colors.mutedText,
        },
        sellerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 12,
        },
        sellerAvatar: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.colors.background,
        },
        sellerAvatarPlaceholder: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sellerAvatarText: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.primary,
        },
        sellerName: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
        },
        cardContent: {
          padding: 16,
        },
        cardTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 8,
        },
        cardInfoRow: {
          flexDirection: 'row',
          marginBottom: 6,
        },
        cardInfoLabel: {
          color: theme.colors.mutedText,
          marginRight: 6,
        },
        cardInfoValue: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        cardPrice: {
          color: theme.colors.primary,
          fontWeight: '700',
        },
        cardCategoryBadge: {
          alignSelf: 'flex-start',
          backgroundColor: theme.colors.background,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 12,
          marginTop: 8,
        },
        cardCategoryText: {
          color: theme.colors.text,
          fontSize: 12,
          fontWeight: '600',
        },
        sheetBackdrop: {
          flex: 1,
          backgroundColor: theme.colors.overlay,
        },
        sheetOverlay: {
          flex: 1,
        },
        sheet: {
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
        },
        sheetTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 12,
        },
        filtersTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginTop: 12,
          marginBottom: 8,
        },
        sortRow: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 8,
        },
        sortButton: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          paddingVertical: 8,
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
        },
        sortActive: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.background,
        },
        sortText: {
          color: theme.colors.text,
        },
        sortTextActive: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        priceInput: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 10,
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
        },
        priceSeparator: {
          color: theme.colors.mutedText,
        },
        selectInput: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 10,
          backgroundColor: theme.colors.surface,
        },
        selectText: {
          color: theme.colors.text,
        },
        selectPlaceholder: {
          color: theme.colors.placeholder,
        },
        selectDisabled: {
          opacity: 0.6,
        },
        categoryRow: {
          marginTop: 6,
        },
        categoryButton: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 16,
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginRight: 8,
          backgroundColor: theme.colors.surface,
        },
        categoryActive: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.background,
        },
        categoryText: {
          color: theme.colors.text,
        },
        categoryTextActive: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        sheetActions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 16,
          gap: 12,
        },
        clearFilters: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
        },
        clearFiltersText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        applyButton: {
          flex: 1,
          backgroundColor: theme.colors.primary,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
        },
        applyButtonText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        sheetScrollContent: {
          paddingBottom: 24,
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
      }),
    [theme],
  );

  const loadListings = async () => {
    try {
      const response = await api.get('/market/listings', {
        params: {
          search: search || undefined,
          category: category || undefined,
          regionId: selectedRegion?.id || undefined,
          districtId: selectedDistrict?.id || undefined,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          sort: sort || undefined,
        },
      });
      const fetched = response.data ?? [];
      const regionFiltered = selectedRegion?.id
        ? fetched.filter((item: Listing) => item.regionId === selectedRegion.id)
        : fetched;
      const districtFiltered = selectedDistrict?.id
        ? regionFiltered.filter((item: any) => item.districtId === selectedDistrict.id)
        : regionFiltered;
      setListings(districtFiltered);
    } catch {
      setListings([]);
    }
  };


  useEffect(() => {
    getSession().then((session) => setRole(session.role));
  }, []);

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    loadListings();
  }, [search, category, minPrice, maxPrice, sort, selectedRegion, selectedDistrict]);


  const loadRegions = async () => {
    try {
      const response = await api.get('/regions');
      const items = (response.data ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      setRegions(items);
    } catch {
      setRegions([]);
    }
  };

  const loadDistricts = async (regionId: string) => {
    try {
      const response = await api.get('/districts', { params: { regionId } });
      const items = (response.data ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      setDistricts(items);
    } catch {
      setDistricts([]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            <PriceTagIcon size={26} color={theme.colors.mutedText} />
            <Text style={styles.emptyTitle}>Әзірге ұсыныс жоқ</Text>
            <Text style={styles.emptyText}>Жаңа өнім шықса, осында көресіз.</Text>
          </View>
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topActions}>
              {role === 'FARMER' ? (
                <>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={() => router.push('/(tabs)/market/my-listings')}
                  >
                    <Text style={styles.actionPillText}>Менікін көру</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={() => router.push('/(tabs)/market/inbox')}
                  >
                    <Text style={styles.actionPillText}>Ұсыныстар</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity
                style={styles.actionPill}
                onPress={() => router.push('/(tabs)/market/deals')}
              >
                <Text style={styles.actionPillText}>Келісімдер</Text>
              </TouchableOpacity>
            </ScrollView>

            <TextInput
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              placeholder="Іздеу..."
              placeholderTextColor={theme.colors.placeholder}
            />

            <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters(true)}>
              <Text style={styles.filterToggleText}>Сүзгілер</Text>
            </TouchableOpacity>
            <Text style={styles.resultsCount}>Табылды: {listings.length}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.coverImageUrl ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setViewerImage(item.coverImageUrl ?? null);
                  setViewerVisible(true);
                }}
              >
                <Image source={{ uri: item.coverImageUrl }} style={styles.cardImage} resizeMode="cover" />
              </TouchableOpacity>
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Text style={styles.cardImagePlaceholderText}>📷</Text>
              </View>
            )}
            {(() => {
              const seller = item.seller;
              if (!seller) {
                return null;
              }
              return (
              <TouchableOpacity
                style={styles.sellerRow}
                onPress={() => router.push({ pathname: '/u/[userId]', params: { userId: seller.id } })}
              >
                {seller.avatarUrl ? (
                  <Image source={{ uri: seller.avatarUrl }} style={styles.sellerAvatar} />
                ) : (
                  <View style={styles.sellerAvatarPlaceholder}>
                    <Text style={styles.sellerAvatarText}>
                      {(seller.displayName || 'F')[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.sellerName}>{seller.displayName}</Text>
              </TouchableOpacity>
              );
            })()}
            <TouchableOpacity
              style={styles.cardContent}
              activeOpacity={0.8}
              onPress={() =>
                router.push({ pathname: '/(tabs)/market/details/[id]', params: { id: item.id } })
              }
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardInfoRow}>
                <Text style={styles.cardInfoLabel}>Көлемі:</Text>
                <Text style={styles.cardInfoValue}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text style={styles.cardInfoLabel}>Бағасы:</Text>
                <Text style={styles.cardPrice}>
                  {(item.price ?? 0).toLocaleString('kk-KZ')} {item.currency}
                </Text>
              </View>
              {item.category ? (
                <View style={styles.cardCategoryBadge}>
                  <Text style={styles.cardCategoryText}>
                    {categories.find((c) => c.value === item.category)?.label ?? item.category}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        )}
      />

      {role === 'FARMER' ? (
        <FloatingActionButton
          label="+ Өнім қосу"
          onPress={() => router.push('/(tabs)/market/create')}
        />
      ) : null}

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={styles.sheetOverlay} onPress={() => setShowFilters(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Сүзгілер</Text>

            <Text style={styles.filtersTitle}>Сұрыптау</Text>
            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[styles.sortButton, sort === 'latest' && styles.sortActive]}
                onPress={() => setSort('latest')}
              >
                <Text style={[styles.sortText, sort === 'latest' && styles.sortTextActive]}>Жаңа</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sort === 'price_asc' && styles.sortActive]}
                onPress={() => setSort('price_asc')}
              >
                <Text style={[styles.sortText, sort === 'price_asc' && styles.sortTextActive]}>Баға ↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sort === 'price_desc' && styles.sortActive]}
                onPress={() => setSort('price_desc')}
              >
                <Text style={[styles.sortText, sort === 'price_desc' && styles.sortTextActive]}>
                  Баға ↓
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filtersTitle}>Баға диапазоны</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Мин. баға"
                        placeholderTextColor={theme.colors.placeholder}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>—</Text>
              <TextInput
                style={styles.priceInput}
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Макс. баға"
                        placeholderTextColor={theme.colors.placeholder}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.filtersTitle}>Облыс</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setShowRegionSheet(true)}>
              <Text style={selectedRegion ? styles.selectText : styles.selectPlaceholder}>
                {selectedRegion?.name ?? 'Облысты таңдаңыз'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.filtersTitle}>Аудан</Text>
            <TouchableOpacity
              style={[styles.selectInput, !selectedRegion && styles.selectDisabled]}
              onPress={() => {
                if (!selectedRegion) return;
                setShowDistrictSheet(true);
              }}
            >
              <Text style={selectedDistrict ? styles.selectText : styles.selectPlaceholder}>
                {selectedDistrict?.name ?? 'Ауданды таңдаңыз'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.filtersTitle}>Категория</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
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
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.clearFilters}
                onPress={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setCategory('');
                  setSort('latest');
                  setSelectedRegion(null);
                  setSelectedDistrict(null);
                  setDistricts([]);
                }}
              >
                <Text style={styles.clearFiltersText}>Тазарту</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Қолдану</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomSheetSelect
        visible={showRegionSheet}
        title="Облыс таңдау"
        options={regions}
        onClose={() => setShowRegionSheet(false)}
        onSelect={(item) => {
          setShowRegionSheet(false);
          setSelectedRegion(item);
          setSelectedDistrict(null);
          setDistricts([]);
          loadDistricts(item.id);
        }}
      />
      <BottomSheetSelect
        visible={showDistrictSheet}
        title="Аудан таңдау"
        options={districts}
        onClose={() => setShowDistrictSheet(false)}
        onSelect={(item) => {
          setShowDistrictSheet(false);
          setSelectedDistrict(item);
        }}
      />

      <ImageViewing
        images={viewerImages}
        imageIndex={0}
        visible={viewerVisible}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
        onRequestClose={() => {
          setViewerVisible(false);
          setViewerImage(null);
        }}
        HeaderComponent={() => (
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              style={styles.viewerClose}
              onPress={() => {
                setViewerVisible(false);
                setViewerImage(null);
              }}
            >
              <Text style={styles.viewerCloseText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

