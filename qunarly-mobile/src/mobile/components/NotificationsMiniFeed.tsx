import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/mobile/theme';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  type?: string | null;
};

type NotificationsMiniFeedProps = {
  items: NotificationItem[];
  limit?: number;
  allowedTypes?: string[];
};

export default function NotificationsMiniFeed({
  items,
  limit = 3,
  allowedTypes,
}: NotificationsMiniFeedProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          padding: 12,
          backgroundColor: theme.colors.surface,
          marginBottom: 10,
        },
        title: {
          color: theme.colors.text,
          fontWeight: '700',
          marginBottom: 4,
        },
        body: {
          color: theme.colors.mutedText,
        },
        meta: {
          color: theme.colors.placeholder,
          marginTop: 6,
          fontSize: 12,
        },
      }),
    [theme],
  );

  const filtered = allowedTypes?.length
    ? items.filter((item) => item.type && allowedTypes.includes(item.type))
    : items;

  return (
    <>
      {filtered.slice(0, limit).map((notification) => (
        <View key={notification.id} style={styles.card}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.body}>{notification.body}</Text>
          <Text style={styles.meta}>{new Date(notification.createdAt).toLocaleString('kk-KZ')}</Text>
        </View>
      ))}
    </>
  );
}
