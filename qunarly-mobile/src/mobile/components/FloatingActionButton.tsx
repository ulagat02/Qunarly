import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/mobile/theme';

type FloatingActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  bottomOffset?: number;
  style?: ViewStyle;
};

export default function FloatingActionButton({
  label,
  onPress,
  disabled,
  loading,
  bottomOffset,
  style,
}: FloatingActionButtonProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const resolvedBottom = (bottomOffset ?? 8) + insets.bottom;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          position: 'absolute',
          right: 16,
          bottom: resolvedBottom,
          backgroundColor: theme.colors.primary,
          height: 46,
          paddingHorizontal: 16,
          borderRadius: 23,
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: theme.dark ? 0.3 : 0.2,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 3,
          zIndex: 100,
        },
        text: {
          color: theme.colors.surface,
          fontWeight: '700',
        },
        content: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        disabled: {
          opacity: 0.6,
        },
      }),
    [theme, resolvedBottom],
  );

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={theme.colors.surface} /> : null}
        <Text style={styles.text}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}
