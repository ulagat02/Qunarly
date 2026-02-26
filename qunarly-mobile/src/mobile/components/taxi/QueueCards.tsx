import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '@/src/mobile/theme';

export type QueuePassenger = {
  id: string;
  userId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  seatsRequested: number;
  pickupLabel?: string | null;
  departLabel?: string | null;
  status?: string;
};

type QueueNextCardProps = {
  passenger: QueuePassenger;
  onConfirm: () => void;
  onSkip: () => void;
};

type QueueMiniCardProps = {
  passenger: QueuePassenger;
  onRemove?: () => void;
};

export function QueueNextCard({ passenger, onConfirm, onSkip }: QueueNextCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 12,
          gap: 8,
          backgroundColor: theme.colors.surface,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
        },
        avatar: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: {
          color: theme.colors.primary,
          fontWeight: '700',
        },
        name: {
          color: theme.colors.text,
          fontWeight: '700',
          fontSize: 16,
        },
        meta: {
          color: theme.colors.mutedText,
          fontSize: 12,
        },
        actions: {
          flexDirection: 'row',
          gap: 8,
        },
        confirm: {
          flex: 1,
          backgroundColor: theme.colors.primary,
          paddingVertical: 10,
          borderRadius: 12,
          alignItems: 'center',
        },
        skip: {
          flex: 1,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 10,
          borderRadius: 12,
          alignItems: 'center',
        },
        confirmText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        skipText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const name =
    passenger.displayName?.trim() || 'Жолаушы';
  const initials = name ? name.slice(0, 1).toUpperCase() : 'Ж';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {passenger.avatarUrl ? (
          <Image source={{ uri: passenger.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>Орын: {passenger.seatsRequested}</Text>
          {passenger.pickupLabel ? (
            <Text style={styles.meta}>Кездесу: {passenger.pickupLabel}</Text>
          ) : null}
          {passenger.departLabel ? (
            <Text style={styles.meta}>Шығу: {passenger.departLabel}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.confirm} onPress={onConfirm}>
          <Text style={styles.confirmText}>Растау</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skip} onPress={onSkip}>
          <Text style={styles.skipText}>Бас тарту</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function QueueMiniCard({ passenger, onRemove }: QueueMiniCardProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: 120,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: 10,
          backgroundColor: theme.colors.surface,
          gap: 6,
        },
        avatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: theme.colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: {
          color: theme.colors.primary,
          fontWeight: '700',
        },
        name: {
          color: theme.colors.text,
          fontWeight: '600',
          fontSize: 12,
        },
        meta: {
          color: theme.colors.mutedText,
          fontSize: 12,
        },
        remove: {
          marginTop: 6,
          paddingVertical: 4,
          borderRadius: 8,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
        },
        removeText: {
          color: theme.colors.text,
          fontSize: 11,
        },
      }),
    [theme],
  );

  const name = passenger.displayName?.trim() || 'Жолаушы';
  const initials = name ? name.slice(0, 1).toUpperCase() : 'Ж';

  return (
    <View style={styles.card}>
      {passenger.avatarUrl ? (
        <Image source={{ uri: passenger.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.meta}>Орын: {passenger.seatsRequested}</Text>
      {onRemove ? (
        <TouchableOpacity style={styles.remove} onPress={onRemove}>
          <Text style={styles.removeText}>Орын босату</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function EmptyQueueState() {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
      <Text style={{ color: theme.colors.mutedText }}>Кезек бос</Text>
    </View>
  );
}

export function QueueCarousel({
  passengers,
  onRemove,
  title,
}: {
  passengers: QueuePassenger[];
  onRemove?: (id: string) => void;
  title?: string;
}) {
  const { theme } = useTheme();
  return (
    <View>
      <Text style={{ color: theme.colors.mutedText, marginBottom: 8 }}>{title ?? 'Келесілер'}</Text>
      <FlatList
        data={passengers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={130}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <QueueMiniCard passenger={item} onRemove={onRemove ? () => onRemove(item.id) : undefined} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
      />
    </View>
  );
}
