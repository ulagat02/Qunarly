import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/mobile/theme';

export type SelectOption = {
  id: string;
  name: string;
};

type BottomSheetSelectProps = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  allowCreate?: boolean;
  onCreate?: (name: string) => void;
  emptyMessage?: string;
  onClose: () => void;
  onSelect: (option: SelectOption) => void;
};

export default function BottomSheetSelect({
  visible,
  title,
  options,
  searchPlaceholder,
  onSearchChange,
  allowCreate,
  onCreate,
  emptyMessage,
  onClose,
  onSelect,
}: BottomSheetSelectProps) {
  const [query, setQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { theme } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    onSearchChange?.(query);
  }, [query, onSearchChange]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }
    return options.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [options, query]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const sheetMaxHeight = Math.max(260, screenHeight - keyboardHeight - 80);
  const listMaxHeight = Math.max(160, sheetMaxHeight - 160);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.colors.overlay,
          justifyContent: 'flex-end',
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
        },
        sheetSafeArea: {
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        sheet: {
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 8 : 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: sheetMaxHeight,
        },
        title: {
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 12,
          color: theme.colors.text,
        },
        search: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 10,
          marginBottom: 12,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        },
        list: {
          maxHeight: listMaxHeight,
        },
        listContent: {
          paddingBottom: 16,
        },
        option: {
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: theme.colors.background,
        },
        optionText: {
          fontSize: 14,
          color: theme.colors.text,
        },
        empty: {
          color: theme.colors.mutedText,
          textAlign: 'center',
          marginTop: 12,
        },
      }),
    [theme],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0,
          }}
        >
          <SafeAreaView edges={['bottom']} style={styles.sheetSafeArea}>
            <View style={styles.sheet}>
              <Text style={styles.title}>{title}</Text>
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholderTextColor={theme.colors.placeholder}
                placeholder={searchPlaceholder ?? 'Іздеу...'}
              />
              <FlatList<SelectOption>
                data={filtered}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                removeClippedSubviews={false}
                renderItem={({ item }: { item: SelectOption }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      setQuery('');
                      onSelect(item);
                    }}
                  >
                    <Text style={styles.optionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View>
                    <Text style={styles.empty}>
                      {emptyMessage ?? (options.length ? 'Нәтиже табылмады' : 'Тізім бос')}
                    </Text>
                    {allowCreate && onCreate && query.trim().length >= 2 ? (
                      <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                          const value = query.trim();
                          setQuery('');
                          onCreate(value);
                        }}
                      >
                        <Text style={styles.optionText}>Қосу: {query.trim()}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                }
              />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}