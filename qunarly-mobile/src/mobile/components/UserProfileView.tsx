import { ReactNode, useMemo } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SelectOption } from './BottomSheetSelect';
import { useTheme } from '@/src/mobile/theme';

type RatingStats = {
  rating?: number;
  reviewsCount?: number;
};

type UserProfileViewProps = {
  mode: 'edit' | 'public';
  title?: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  farmName?: string | null;
  regionName?: string | null;
  districtName?: string | null;
  settlementName?: string | null;
  displayNameValue?: string;
  firstNameValue?: string;
  phoneValue?: string;
  farmNameValue?: string;
  settlementNameValue?: string;
  bioValue?: string;
  publicProfile?: boolean;
  ratingStats?: RatingStats | null;
  selectedRegion?: SelectOption | null;
  selectedDistrict?: SelectOption | null;
  districtHelperText?: string | null;
  showManualDistrictInput?: boolean;
  manualDistrictValue?: string;
  onChangeManualDistrict?: (value: string) => void;
  loading?: boolean;
  showEditButton?: boolean;
  onEditPress?: () => void;
  onPickAvatar?: () => void;
  onChangeDisplayName?: (value: string) => void;
  onChangeFirstName?: (value: string) => void;
  onChangePhone?: (value: string) => void;
  onChangeFarmName?: (value: string) => void;
  onChangeBio?: (value: string) => void;
  onTogglePublicProfile?: (value: boolean) => void;
  onOpenRegion?: () => void;
  onOpenDistrict?: () => void;
  onOpenSettlement?: () => void;
  onSave?: () => void;
  onContactPress?: () => void;
  children?: ReactNode;
};

export default function UserProfileView(props: UserProfileViewProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    mode,
    title,
    displayName,
    avatarUrl,
    bio,
    phone,
    farmName,
    regionName,
    districtName,
    settlementName,
    displayNameValue,
    firstNameValue,
    phoneValue,
    farmNameValue,
    settlementNameValue,
    bioValue,
    publicProfile,
    ratingStats,
    selectedRegion,
    selectedDistrict,
    districtHelperText,
    showManualDistrictInput,
    manualDistrictValue,
    onChangeManualDistrict,
    loading,
    showEditButton,
    onEditPress,
    onPickAvatar,
    onChangeDisplayName,
    onChangeFirstName,
    onChangePhone,
    onChangeFarmName,
    onChangeBio,
    onTogglePublicProfile,
    onOpenRegion,
    onOpenDistrict,
    onOpenSettlement,
    onSave,
    onContactPress,
    children,
  } = props;

  const headerTitle = title ?? (mode === 'edit' ? 'Профиль' : 'Фермер профилі');

  const locationLabel = useMemo(() => {
    const parts = [regionName, districtName, settlementName].filter(Boolean);
    return parts.length ? parts.join(' • ') : 'Аймақ көрсетілмеген';
  }, [regionName, districtName, settlementName]);

  const avatarLetter = useMemo(() => {
    const trimmed = (displayName || '').trim();
    return trimmed.length ? trimmed[0].toUpperCase() : '?';
  }, [displayName]);

  const resolvedRating = ratingStats?.rating ?? 0;
  const resolvedReviews = ratingStats?.reviewsCount ?? 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
        },
        container: {
          flexGrow: 1,
          padding: 16,
          paddingBottom: 140,
          backgroundColor: theme.colors.background,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.text,
        },
        editButton: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          backgroundColor: theme.colors.background,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        editButtonText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        avatarContainer: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          marginBottom: 16,
        },
        avatar: {
          width: 96,
          height: 96,
          borderRadius: 48,
          marginBottom: 12,
          backgroundColor: theme.colors.background,
        },
        avatarPlaceholder: {
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        },
        avatarPlaceholderText: {
          fontSize: 32,
          color: theme.colors.primary,
          fontWeight: '700',
        },
        avatarInfo: {
          alignItems: 'center',
          marginBottom: 12,
        },
        displayName: {
          fontSize: 18,
          fontWeight: '700',
          color: theme.colors.text,
        },
        location: {
          marginTop: 4,
          fontSize: 13,
          color: theme.colors.mutedText,
        },
        avatarButton: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
        avatarButtonText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        publicStats: {
          marginBottom: 16,
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          gap: 10,
        },
        ratingText: {
          fontSize: 14,
          color: theme.colors.text,
          fontWeight: '600',
        },
        contactButton: {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
        },
        contactButtonText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        section: {
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '600',
          marginBottom: 8,
          color: theme.colors.text,
        },
        sectionText: {
          fontSize: 14,
          color: theme.colors.mutedText,
          marginBottom: 12,
          lineHeight: 20,
        },
        infoRow: {
          flexDirection: 'row',
          marginBottom: 8,
        },
        infoLabel: {
          minWidth: 90,
          color: theme.colors.mutedText,
        },
        infoValue: {
          color: theme.colors.text,
          fontWeight: '600',
          flex: 1,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 6,
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
        textArea: {
          minHeight: 90,
          textAlignVertical: 'top',
        },
        selectInput: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 10,
          padding: 10,
          marginBottom: 12,
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
        helperText: {
          color: theme.colors.mutedText,
          fontSize: 12,
          marginTop: -4,
          marginBottom: 8,
        },
        toggleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          marginBottom: 16,
        },
        button: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: 'center',
        },
        buttonText: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{headerTitle}</Text>
          {showEditButton && onEditPress ? (
            <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
              <Text style={styles.editButtonText}>Өңдеу</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{avatarLetter}</Text>
            </View>
          )}
          <View style={styles.avatarInfo}>
            <Text style={styles.displayName}>{displayName || 'Фермер'}</Text>
            <Text style={styles.location}>{locationLabel}</Text>
          </View>
          {mode === 'edit' && onPickAvatar ? (
            <TouchableOpacity style={styles.avatarButton} onPress={onPickAvatar}>
              <Text style={styles.avatarButtonText}>Аватарды өзгерту</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {mode === 'public' ? (
          <View style={styles.publicStats}>
            <Text style={styles.ratingText}>
              Рейтинг: {resolvedRating.toFixed(1)} • Пікірлер: {resolvedReviews}
            </Text>
            {onContactPress ? (
              <TouchableOpacity style={styles.contactButton} onPress={onContactPress}>
                <Text style={styles.contactButtonText}>Хабарласу</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {mode === 'public' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Қысқаша био</Text>
            <Text style={styles.sectionText}>{bio || 'Био көрсетілмеген.'}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Шаруашылық:</Text>
              <Text style={styles.infoValue}>{farmName || 'Көрсетілмеген'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Байланыс:</Text>
              <Text style={styles.infoValue}>Қоғамдық профиль</Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Көрінетін аты</Text>
            <TextInput
              style={styles.input}
              value={displayNameValue}
              onChangeText={onChangeDisplayName}
              placeholderTextColor={theme.colors.placeholder}
              placeholder="Көрінетін аты"
            />
            <Text style={styles.label}>Қысқаша био</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bioValue}
              onChangeText={onChangeBio}
              placeholderTextColor={theme.colors.placeholder}
              placeholder="Өзіңіз туралы қысқаша"
              multiline
            />
            <Text style={styles.label}>Аты</Text>
            <TextInput
              style={styles.input}
              value={firstNameValue}
              onChangeText={onChangeFirstName}
              placeholderTextColor={theme.colors.placeholder}
              placeholder="Атыңызды енгізіңіз"
            />
            <Text style={styles.label}>Телефон</Text>
            <TextInput
              style={styles.input}
              value={phoneValue}
              onChangeText={onChangePhone}
              placeholderTextColor={theme.colors.placeholder}
              placeholder="7700..."
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Облыс</Text>
            <TouchableOpacity style={styles.selectInput} onPress={onOpenRegion}>
              <Text style={selectedRegion ? styles.selectText : styles.selectPlaceholder}>
                {selectedRegion?.name ?? 'Облысты таңдаңыз'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>Аудан</Text>
            <TouchableOpacity
              style={[styles.selectInput, !selectedRegion && styles.selectDisabled]}
              onPress={onOpenDistrict}
            >
              <Text style={selectedDistrict ? styles.selectText : styles.selectPlaceholder}>
                {selectedDistrict?.name ?? 'Ауданды таңдаңыз'}
              </Text>
            </TouchableOpacity>
            {districtHelperText ? <Text style={styles.helperText}>{districtHelperText}</Text> : null}
            {showManualDistrictInput ? (
              <TextInput
                style={styles.input}
                value={manualDistrictValue}
                onChangeText={onChangeManualDistrict}
                placeholderTextColor={theme.colors.placeholder}
                placeholder="Аудан атауын қолмен енгізіңіз"
              />
            ) : null}
            <Text style={styles.label}>Ауыл</Text>
            <TouchableOpacity
              style={[styles.selectInput, !selectedDistrict && styles.selectDisabled]}
              onPress={onOpenSettlement}
            >
              <Text style={settlementNameValue ? styles.selectText : styles.selectPlaceholder}>
                {settlementNameValue || 'Ауылды таңдаңыз'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>Шаруашылық атауы</Text>
            <TextInput
              style={styles.input}
              value={farmNameValue}
              onChangeText={onChangeFarmName}
              placeholderTextColor={theme.colors.placeholder}
              placeholder="Мысалы: Qunarly Farm"
            />
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Профиль көпшілікке ашық</Text>
              <Switch
                value={publicProfile ?? true}
                onValueChange={(value) => onTogglePublicProfile?.(value)}
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={onSave} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Сақталуда...' : 'Сақтау'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
