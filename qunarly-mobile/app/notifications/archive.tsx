import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';
import type { HomeNotification } from '@/src/mobile/components/HomeNotifications';

export default function NotificationsArchiveScreen() {
  const { theme } = useTheme();
  const [items, setItems] = useState<HomeNotification[]>([]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: 16,
          paddingBottom: 40,
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 12,
        },
        card: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 14,
          padding: 14,
          backgroundColor: theme.colors.surface,
          marginBottom: 12,
        },
        cardTitle: {
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: 4,
        },
        cardBody: {
          color: theme.colors.mutedText,
        },
        cardMeta: {
          color: theme.colors.placeholder,
          marginTop: 6,
          fontSize: 12,
        },
        restoreButton: {
          marginTop: 10,
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
          alignSelf: 'flex-start',
        },
        restoreText: {
          color: theme.colors.primary,
          fontWeight: '600',
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
        emptyText: {
          color: theme.colors.mutedText,
          textAlign: 'center',
        },
      }),
    [theme],
  );

  const loadArchive = useCallback(async () => {
    try {
      const response = await api.get('/notifications/my');
      const fetched = response.data ?? [];
      setItems(fetched.filter((item: HomeNotification) => item.isRead));
    } catch (error) {
      const info = parseApiError(error);
      console.log('[Archive] Load error:', info.message);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadArchive();
  }, [loadArchive]);

  const restore = async (item: HomeNotification) => {
    try {
      await api.patch(`/notifications/${item.id}`, { status: 'ACTIVE' });
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    } catch (error) {
      const info = parseApiError(error);
      console.log('[Archive] Restore error:', info.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Архив</Text>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="archive-outline" size={22} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyText}>Архив бос.</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString('kk-KZ')}</Text>
            <TouchableOpacity style={styles.restoreButton} onPress={() => restore(item)}>
              <Text style={styles.restoreText}>Қалпына келтіру</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}
