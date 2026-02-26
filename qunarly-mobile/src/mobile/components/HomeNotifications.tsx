import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/mobile/theme';
import { FlatList } from 'react-native-gesture-handler';

export type HomeNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  type?: string | null;
  dataJson?: any;
};

type HomeNotificationsProps = {
  items: HomeNotification[];
  onDismiss: (item: HomeNotification) => void;
};

const STATUS_FLOW = ['CREATED', 'OFFERED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED'] as const;

const typeToStatus: Record<string, (typeof STATUS_FLOW)[number]> = {
  MARKET_ORDER: 'CREATED',
  DELIVERY_OFFER: 'OFFERED',
  SHIPMENT_ASSIGNED: 'ASSIGNED',
  LEG_ACCEPTED: 'ASSIGNED',
  LEG_STARTED: 'PICKED_UP',
  LEG_COMPLETED: 'DELIVERED',
  NEW_DELIVERY_LEG: 'CREATED',
};

const getStatusIndex = (status?: string | null) => {
  if (!status) return 0;
  const index = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  return index >= 0 ? index : 0;
};

export default function HomeNotifications({ items, onDismiss }: HomeNotificationsProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 14,
          padding: 14,
          backgroundColor: theme.colors.surface,
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
        timeline: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 10,
        },
        dot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
        },
        dotDone: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        dotActive: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primary,
          width: 12,
          height: 12,
          borderRadius: 6,
        },
        line: {
          flex: 1,
          height: 2,
          backgroundColor: theme.colors.border,
        },
        lineDone: {
          backgroundColor: theme.colors.primary,
        },
        row: {
          position: 'relative',
          marginBottom: 12,
        },
        rightAction: {
          backgroundColor: theme.colors.danger,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          borderRadius: 14,
        },
      }),
    [theme],
  );

  const handlePress = (item: HomeNotification) => {
    const sourceType = item.dataJson?.sourceType;
    const shipmentId = item.dataJson?.shipmentId;
    const dealId = item.dataJson?.dealId;
    if (shipmentId || sourceType === 'SHIPMENT') {
      router.push('/(tabs)/logistics');
      return;
    }
    if (dealId || sourceType === 'DEAL') {
      router.push('/(tabs)/market/deals');
    }
  };

  const renderTimeline = (item: HomeNotification) => {
    const status = item.dataJson?.shipmentStatus ?? typeToStatus[item.type ?? ''];
    const activeIndex = getStatusIndex(status);
    return (
      <View style={styles.timeline}>
        {STATUS_FLOW.map((_, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <View key={`${item.id}-dot-${index}`} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]} />
              {index < STATUS_FLOW.length - 1 ? (
                <View style={[styles.line, (done || active) && styles.lineDone]} />
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  const RightAction = ({
    dragX,
    onPress,
    width,
  }: {
    dragX: Animated.SharedValue<number>;
    onPress: () => void;
    width: number;
  }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const progress = Math.min(1, Math.max(0, Math.abs(dragX.value) / 120));
      return {
        opacity: interpolate(progress, [0, 1], [0.3, 1]),
        transform: [{ scale: interpolate(progress, [0, 1], [0.7, 1]) }],
      };
    });

    return (
      <View style={[styles.rightAction, { width }]}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          <Animated.View style={animatedStyle}>
            <Ionicons name="trash-outline" size={28} color={theme.colors.surface} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const NotificationRow = memo(({ item }: { item: HomeNotification }) => {
    const [rowWidth, setRowWidth] = useState(320);
    const fullSwipeThreshold = Math.max(0, rowWidth * 0.75);
    const actionWidth = Math.max(60, rowWidth * 0.28);
    const translateX = useSharedValue(0);

    useEffect(() => {
      if (openId !== item.id && translateX.value !== 0) {
        translateX.value = withSpring(0);
      }
    }, [openId, item.id, translateX]);

    const panGesture = Gesture.Pan()
      .onBegin(() => {
        runOnJS(setOpenId)(item.id);
      })
      .onUpdate((event) => {
        const next = Math.max(-fullSwipeThreshold, Math.min(0, event.translationX));
        translateX.value = next;
      })
      .onEnd(() => {
        const ratio = rowWidth > 0 ? Math.abs(translateX.value) / rowWidth : 0;
        if (ratio >= 0.75) {
          translateX.value = withTiming(-rowWidth, { duration: 160 });
          runOnJS(onDismiss)(item);
        } else if (Math.abs(translateX.value) >= actionWidth * 0.5) {
          translateX.value = withSpring(-actionWidth);
        } else {
          translateX.value = withSpring(0);
        }
      });

    const cardStyle = useAnimatedStyle(() => {
      const gap = 8;
      return {
        transform: [{ translateX: translateX.value }],
        marginRight: translateX.value < 0 ? gap : 0,
      };
    });

    return (
      <View style={styles.row}>
        <View style={[styles.rightAction, { width: actionWidth }]}>
          <RightAction
            dragX={translateX}
            width={actionWidth}
            onPress={() => {
              translateX.value = withTiming(-rowWidth, { duration: 160 });
              onDismiss(item);
            }}
          />
        </View>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={cardStyle} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
            <TouchableOpacity style={styles.card} onPress={() => handlePress(item)} activeOpacity={0.8}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString('kk-KZ')}</Text>
              {renderTimeline(item)}
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  });

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NotificationRow item={item} />}
      removeClippedSubviews={false}
      scrollEnabled={false}
      initialNumToRender={6}
    />
  );
}
