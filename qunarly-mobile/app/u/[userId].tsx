import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useUserProfile } from '@/src/mobile/store/userProfile';
import UserProfileView from '@/src/mobile/components/UserProfileView';
import { useTheme } from '@/src/mobile/theme';

type ListingSummary = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  price: number;
  currency: string;
  coverImageUrl?: string | null;
};

type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  region?: {
    regionName?: string | null;
    districtName?: string | null;
    settlementName?: string | null;
  };
  ratingStats?: { rating?: number; reviewsCount?: number } | null;
  listings?: ListingSummary[];
};

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const { theme } = useTheme();

  const loadProfile = async () => {
    try {
      const response = await api.get(`/users/${userId}/public`);
      setPublicProfile(response.data);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  const isOwner = useMemo(() => {
    if (!userId || !profile?.userId) return false;
    return userId === profile.userId;
  }, [userId, profile?.userId]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        listingsSection: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
        },
        listingsTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 12,
        },
        listingCard: {
          flexDirection: 'row',
          gap: 12,
          paddingVertical: 10,
        },
        listingImage: {
          width: 80,
          height: 80,
          borderRadius: 12,
          backgroundColor: theme.colors.background,
        },
        listingPlaceholder: {
          width: 80,
          height: 80,
          borderRadius: 12,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        listingPlaceholderText: {
          fontSize: 28,
          color: theme.colors.mutedText,
        },
        listingInfo: {
          flex: 1,
        },
        listingTitle: {
          fontSize: 15,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 6,
        },
        listingMeta: {
          color: theme.colors.mutedText,
          marginBottom: 4,
        },
        listingPrice: {
          fontWeight: '700',
          color: theme.colors.primary,
        },
        emptyText: {
          color: theme.colors.mutedText,
        },
      }),
    [theme],
  );

  if (!publicProfile) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Жүктелуде...</Text>
      </View>
    );
  }

  const listings = publicProfile.listings ?? [];

  return (
    <UserProfileView
      mode="public"
      title="Фермер профилі"
      displayName={publicProfile.displayName}
      avatarUrl={publicProfile.avatarUrl ?? null}
      bio={publicProfile.bio ?? null}
      regionName={publicProfile.region?.regionName ?? null}
      districtName={publicProfile.region?.districtName ?? null}
      settlementName={publicProfile.region?.settlementName ?? null}
      ratingStats={publicProfile.ratingStats ?? null}
      showEditButton={isOwner}
      onEditPress={() => router.push('/profile')}
      onContactPress={() => Alert.alert('Жақында', 'Хабарласу мүмкіндігі кейін қосылады.')}
    >
      <View style={styles.listingsSection}>
        <Text style={styles.listingsTitle}>Жарияланымдары</Text>
        {listings.length ? (
          listings.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listingCard}
              onPress={() =>
                router.push({ pathname: '/(tabs)/market/details/[id]', params: { id: item.id } })
              }
            >
              {item.coverImageUrl ? (
                <Image source={{ uri: item.coverImageUrl }} style={styles.listingImage} />
              ) : (
                <View style={styles.listingPlaceholder}>
                  <Text style={styles.listingPlaceholderText}>📷</Text>
                </View>
              )}
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>{item.title}</Text>
                <Text style={styles.listingMeta}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={styles.listingPrice}>
                  {(item.price ?? 0).toLocaleString('kk-KZ')} {item.currency}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Жарияланым жоқ</Text>
        )}
      </View>
    </UserProfileView>
  );
}

