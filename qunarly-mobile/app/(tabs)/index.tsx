import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useUserProfile } from '@/src/mobile/store/userProfile';
import { useTheme } from '@/src/mobile/theme';
import HomeNotifications, { HomeNotification } from '@/src/mobile/components/HomeNotifications';

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { profile, refresh } = useUserProfile();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    listings: 0,
    fieldOpen: 0,
    shipmentsActive: 0,
  });
  const [allNotifications, setAllNotifications] = useState<HomeNotification[]>([]);
  const [tempDismissedIds, setTempDismissedIds] = useState<string[]>([]);
  const [undoItem, setUndoItem] = useState<HomeNotification | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [postText, setPostText] = useState('');
  const [posts, setPosts] = useState<string[]>([]);

  const mySections: never[] = [];

  const displayName = useMemo(() => {
    return profile?.displayName || profile?.firstName || profile?.name || 'Qunarly';
  }, [profile?.displayName, profile?.firstName, profile?.name]);

  const displayRole = profile?.role ?? 'Қолданушы';

  const avatarLetter = useMemo(() => {
    const trimmed = displayName.trim();
    return trimmed.length ? trimmed[0].toUpperCase() : 'U';
  }, [displayName]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: 20,
          paddingTop: Math.max(12, insets.top + 4),
          paddingBottom: 32,
        },
        headerCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.dark ? 0.2 : 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        headerText: {
          flex: 1,
          marginRight: 12,
        },
        headerAvatar: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        avatarImage: {
          width: 56,
          height: 56,
          borderRadius: 28,
        },
        avatarPlaceholder: {
          fontSize: 28,
          color: theme.colors.primary,
          fontWeight: '700',
        },
        welcome: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
        },
        subText: {
          fontSize: 14,
          color: theme.colors.mutedText,
          marginTop: 4,
        },
        section: {
          marginBottom: 20,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 12,
        },
        statsRow: {
          flexDirection: 'row',
          gap: 12,
        },
        statCard: {
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
        },
        statValue: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
        },
        statLabel: {
          fontSize: 12,
          color: theme.colors.mutedText,
          marginTop: 6,
        },
        notificationCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        },
        notificationTitle: {
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 6,
        },
        notificationText: {
          color: theme.colors.mutedText,
        },
        emptyState: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          gap: 8,
        },
        emptyIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyTitle: {
          fontWeight: '600',
          color: theme.colors.text,
        },
        emptyHint: {
          color: theme.colors.mutedText,
          textAlign: 'center',
        },
        archiveButton: {
          marginTop: 6,
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
        },
        archiveText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        snackbar: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        snackbarText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        snackbarAction: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
        snackbarActionText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        quickActions: {
          gap: 12,
        },
        quickButton: {
          backgroundColor: theme.colors.primary,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
        },
        quickButtonText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        postCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        postInput: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 12,
          minHeight: 80,
          color: theme.colors.text,
          backgroundColor: theme.colors.background,
          textAlignVertical: 'top',
        },
        postButton: {
          marginTop: 10,
          backgroundColor: theme.colors.primary,
          borderRadius: 12,
          paddingVertical: 10,
          alignItems: 'center',
        },
        postButtonText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        postList: {
          marginTop: 12,
          gap: 10,
        },
        postItem: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        postItemTitle: {
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 4,
        },
        postItemBody: {
          color: theme.colors.mutedText,
        },
      }),
    [theme],
  );

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [listingsRes, fieldRes, shipmentsRes, notificationsRes] = await Promise.all([
        api.get('/market/listings').catch(() => ({ data: [] })),
        api.get('/field/jobs').catch(() => ({ data: [] })),
        api.get('/logistics/shipments').catch(() => ({ data: [] })),
        api.get('/notifications/my').catch(() => ({ data: [] })),
      ]);
      await refresh();

      const allListings = listingsRes.data ?? [];
      const listingCount =
        profile?.role === 'FARMER' && profile?.userId
          ? allListings.filter((item: { sellerId?: string }) => item.sellerId === profile.userId)
              .length
          : allListings.length;

      const fieldOpen = (fieldRes.data ?? []).filter(
        (job: { status?: string }) => job.status === 'BROADCASTED',
      ).length;

      const activeShipmentStatuses = ['CREATED', 'ACCEPTED', 'PICKUP_STARTED', 'IN_TRANSIT'];
      const shipmentsActive = (shipmentsRes.data ?? []).filter((shipment: { status?: string }) =>
        activeShipmentStatuses.includes(shipment.status ?? ''),
      ).length;

      setStats({ listings: listingCount, fieldOpen, shipmentsActive });
      const fetchedNotifications = notificationsRes.data ?? [];
      setAllNotifications(fetchedNotifications);
      setTempDismissedIds([]);
    } catch (error: any) {
      const info = parseApiError(error);
      console.log('[Dashboard] Load error:', info.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [profile?.userId]);

  const finalizeDismiss = async (item: HomeNotification) => {
    try {
      await api.patch(`/notifications/${item.id}`, { status: 'DISMISSED' });
      setAllNotifications((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)),
      );
      setTempDismissedIds((prev) => prev.filter((id) => id !== item.id));
    } catch (error) {
      setTempDismissedIds((prev) => prev.filter((id) => id !== item.id));
      const info = parseApiError(error);
      console.log('[Notifications] Dismiss error:', info.message);
    }
  };

  const dismissNotification = (item: HomeNotification) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
      if (undoItem) {
        finalizeDismiss(undoItem);
      }
    }
    setTempDismissedIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    setUndoItem(item);
    setUndoVisible(true);
    undoTimerRef.current = setTimeout(() => {
      setUndoVisible(false);
      if (item) {
        finalizeDismiss(item);
      }
      undoTimerRef.current = null;
      setUndoItem(null);
    }, 6000);
  };

  const undoDismiss = () => {
    if (!undoItem) {
      return;
    }
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setTempDismissedIds((prev) => prev.filter((id) => id !== undoItem.id));
    setUndoVisible(false);
    setUndoItem(null);
  };

  const addPost = () => {
    const trimmed = postText.trim();
    if (!trimmed) {
      return;
    }
    setPosts((prev) => [`Тест пост: ${trimmed}`, ...prev]);
    setPostText('');
  };

  const activeNotifications = useMemo(
    () => allNotifications.filter((item) => !item.isRead && !tempDismissedIds.includes(item.id)),
    [allNotifications, tempDismissedIds],
  );
  const hasArchive = useMemo(() => allNotifications.some((item) => item.isRead), [allNotifications]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} />}
    >
      <TouchableOpacity style={styles.headerCard} onPress={() => router.push('/profile')}>
        <View style={styles.headerText}>
          <Text style={styles.welcome}>Сәлем, {displayName}</Text>
          <Text style={styles.subText}>Рөл: {displayRole}</Text>
        </View>
        <View style={styles.headerAvatar}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarPlaceholder}>{avatarLetter}</Text>
          )}
        </View>
        {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Хабарламалар</Text>
        {activeNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {hasArchive ? 'Барлық хабарламаны өшірдің' : 'Қазір хабарлама жоқ'}
            </Text>
            <Text style={styles.emptyHint}>
              {hasArchive ? 'Қажет болса архивтен қайта қарай аласыз.' : 'Жаңа жаңалықтар шықса осында көрінеді.'}
            </Text>
            {hasArchive ? (
              <TouchableOpacity style={styles.archiveButton} onPress={() => router.push('/notifications/archive')}>
                <Text style={styles.archiveText}>Архивті ашу</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <HomeNotifications items={activeNotifications} onDismiss={dismissNotification} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Белсенділік</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.listings}</Text>
            <Text style={styles.statLabel}>Järmeñke</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.fieldOpen}</Text>
            <Text style={styles.statLabel}>Alap</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.shipmentsActive}</Text>
            <Text style={styles.statLabel}>Tasymal</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Жылдам батырмалар</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/(tabs)/market/create')}
          >
            <Text style={styles.quickButtonText}>Жарияланым қосу</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/(tabs)/field')}
          >
            <Text style={styles.quickButtonText}>Жұмыс ұсыну</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => router.push('/(tabs)/logistics')}
          >
            <Text style={styles.quickButtonText}>Тасымал сұрау</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/map')}>
            <Text style={styles.quickButtonText}>Агро карта</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Пост жазу</Text>
        <View style={styles.postCard}>
          <TextInput
            style={styles.postInput}
            value={postText}
            onChangeText={setPostText}
            placeholder="Тест пост жазыңыз..."
            placeholderTextColor={theme.colors.placeholder}
            multiline
          />
          <TouchableOpacity style={styles.postButton} onPress={addPost}>
            <Text style={styles.postButtonText}>Жариялау</Text>
          </TouchableOpacity>
        </View>
        {posts.length ? (
          <View style={styles.postList}>
            {posts.map((post, index) => (
              <View key={`${post}-${index}`} style={styles.postItem}>
                <Text style={styles.postItemTitle}>Тест жазба</Text>
                <Text style={styles.postItemBody}>{post}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {undoVisible ? (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>Хабарлама өшірілді</Text>
          <TouchableOpacity style={styles.snackbarAction} onPress={undoDismiss}>
            <Text style={styles.snackbarActionText}>Қайтару</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

