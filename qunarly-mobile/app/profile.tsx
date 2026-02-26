import { useEffect, useMemo, useState, useCallback } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, ToastAndroid, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '@/lib/api/client';
import { parseApiError } from '@/lib/api/errors';
import { useUserProfile } from '@/src/mobile/store/userProfile';
import BottomSheetSelect, { SelectOption } from '@/src/mobile/components/BottomSheetSelect';
import UserProfileView from '@/src/mobile/components/UserProfileView';
import MapPicker from '@/src/mobile/components/MapPicker';
import { useTheme } from '@/src/mobile/theme';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [regions, setRegions] = useState<SelectOption[]>([]);
  const [districts, setDistricts] = useState<SelectOption[]>([]);
  const [settlements, setSettlements] = useState<SelectOption[]>([]);
  const [settlementsError, setSettlementsError] = useState<string | null>(null);
  const [districtsError, setDistrictsError] = useState<string | null>(null);
  const [districtsEmpty, setDistrictsEmpty] = useState(false);
  const [manualDistrictName, setManualDistrictName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<SelectOption | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<SelectOption | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SelectOption | null>(null);
  const [regionIdValue, setRegionIdValue] = useState<string | null>(null);
  const [districtIdValue, setDistrictIdValue] = useState<string | null>(null);
  const [settlementIdValue, setSettlementIdValue] = useState<string | null>(null);
  const [showRegionSheet, setShowRegionSheet] = useState(false);
  const [showDistrictSheet, setShowDistrictSheet] = useState(false);
  const [showSettlementSheet, setShowSettlementSheet] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [publicProfile, setPublicProfile] = useState(true);
  const [addressText, setAddressText] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [villageSearch, setVillageSearch] = useState('');
  const debouncedVillageSearch = useDebounce(villageSearch, 300);
  const { profile, setProfile } = useUserProfile();
  const { theme } = useTheme();

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    if (selectedDistrict?.id) {
      loadSettlements(selectedDistrict.id, debouncedVillageSearch);
    }
  }, [selectedDistrict?.id, debouncedVillageSearch]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setFirstName(profile.firstName ?? '');
    setPhone(profile.phone ?? '');
    setRegionIdValue(profile.regionId ?? null);
    setDistrictIdValue(profile.districtId ?? null);
    setSettlementIdValue(profile.settlementId ?? null);
    setFarmName(profile.farmName ?? '');
    setAvatarUrl(profile.avatarUrl ?? null);
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio ?? '');
    setPublicProfile(profile.publicProfile ?? true);
    setAddressText(profile.addressText ?? '');
    setLat(profile.lat ? String(profile.lat) : '');
    setLng(profile.lng ? String(profile.lng) : '');
  }, [profile]);

  useEffect(() => {
    if (regions.length && regionIdValue) {
      const match = regions.find((item) => item.id === regionIdValue);
      if (match) {
        setSelectedRegion(match);
        loadDistricts(match.id);
      }
    }
  }, [regions, regionIdValue]);

  useEffect(() => {
    if (districts.length && districtIdValue) {
      const match = districts.find((item) => item.id === districtIdValue);
      if (match) {
        setSelectedDistrict(match);
        loadSettlements(match.id);
      }
    }
  }, [districts, districtIdValue]);

  useEffect(() => {
    if (settlements.length && settlementIdValue) {
      const match = settlements.find((item) => item.id === settlementIdValue);
      if (match) {
        setSelectedSettlement(match);
      }
    }
  }, [settlements, settlementIdValue]);

  const loadRegions = async () => {
    try {
      const response = await api.get('/regions');
      const items = (response.data ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      setRegions(items);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const loadDistricts = async (regionId: string) => {
    if (!regionId) {
      setDistricts([]);
      setDistrictsEmpty(false);
      setDistrictsError('Алдымен облыс таңдаңыз.');
      console.info('[PROFILE] districts: missing regionId');
      return;
    }
    try {
      console.info('[PROFILE] districts: loading', { regionId });
      const response = await api.get('/districts', { params: { regionId } });
      const items = (response.data ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      setDistricts(items);
      setDistrictsEmpty(items.length === 0);
      setDistrictsError(
        items.length === 0 ? 'Тізім бос. Қолмен енгізу режимін қолданыңыз.' : null,
      );
      console.info('[PROFILE] districts: loaded', { regionId, count: items.length });
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const loadSettlements = async (districtId: string, q?: string) => {
    console.info('[PROFILE] settlements: loading', { districtId, q });
    try {
      const response = await api.get('/community-villages', { params: { districtId, q } });
      const items = (response.data ?? []).map((item: any) => ({
        id: item.id,
        name: item.nameDisplay ?? item.name,
      }));
      setSettlements(items);
      setSettlementsError(null);
      console.info('[PROFILE] settlements: loaded', { districtId, count: items.length });
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setSettlements([]);
        setSettlementsError('Тізім жүктелмеді');
      } else {
        const info = parseApiError(error);
        Alert.alert('Қате', info.message);
      }
    }
  };

  const createVillage = async (name: string) => {
    if (!selectedRegion?.id || !selectedDistrict?.id) {
      Alert.alert('Қате', 'Алдымен облыс және аудан таңдаңыз.');
      return;
    }
    if (!lat || !lng) {
      Alert.alert('Қате', 'Алдымен картадан мекенжайды таңдаңыз.');
      return;
    }
    try {
      const response = await api.post('/community-villages', {
        nameDisplay: name,
        regionId: selectedRegion.id,
        districtId: selectedDistrict.id,
        lat: Number(lat),
        lng: Number(lng),
      });
      const created = response.data;
      if (created?.id) {
        const option = { id: created.id, name: created.nameDisplay ?? name };
        setSettlements((prev) => [option, ...prev]);
        setSelectedSettlement(option);
        setSettlementIdValue(option.id);
      }
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const onSave = async () => {
    if (!selectedRegion?.id) {
      Alert.alert('Қате', 'Алдымен облыс таңдаңыз.');
      return;
    }
    if (!selectedDistrict?.id || !selectedSettlement?.id) {
      if (!districtsEmpty) {
        Alert.alert('Қате', 'Облыс, аудан және ауыл міндетті.');
        return;
      }
    }
    setLoading(true);
    try {
      const response = await api.put('/profiles/me', {
        displayName: displayName || undefined,
        bio: bio || undefined,
        publicProfile,
        firstName,
        phone: phone || undefined,
        regionId: selectedRegion.id,
        districtId: selectedDistrict?.id,
        settlementId: selectedSettlement?.id,
        farmName: farmName || undefined,
        addressText: addressText || undefined,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
      });
      setFirstName(response.data?.firstName ?? firstName);
      setPhone(response.data?.phone ?? phone);
      setRegionIdValue(response.data?.regionId ?? selectedRegion.id);
      setDistrictIdValue(response.data?.districtId ?? selectedDistrict?.id ?? null);
      setSettlementIdValue(response.data?.settlementId ?? selectedSettlement?.id ?? null);
      setFarmName(response.data?.farmName ?? farmName);
      setAvatarUrl(response.data?.avatarUrl ?? avatarUrl);
      setDisplayName(response.data?.displayName ?? displayName);
      setBio(response.data?.bio ?? bio);
      setPublicProfile(response.data?.publicProfile ?? publicProfile);
      setAddressText(response.data?.addressText ?? addressText);
      setLat(response.data?.lat ? String(response.data?.lat) : lat);
      setLng(response.data?.lng ? String(response.data?.lng) : lng);
      setProfile({
        ...profile,
        ...response.data,
      });
      Alert.alert('Сақталды', 'Профиль жаңартылды.');
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    } finally {
      setLoading(false);
    }
  };

  const onAddVillage = (name: string) => {
    if (!selectedDistrict) {
      Alert.alert('Қате', 'Алдымен аудан таңдаңыз.');
      return;
    }
    createVillage(name);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Ауыл қосылды', ToastAndroid.SHORT);
    } else {
      Alert.alert('Сәтті', 'Ауыл қосылды');
    }
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Қате', 'Галереяға рұқсат қажет.');
      return;
    }
    const imageMedia =
      (ImagePicker as any).MediaType?.Images ?? ImagePicker.MediaTypeOptions.Images;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMedia,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) {
      return;
    }
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    } as any);
    try {
      const response = await api.post('/profiles/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(response.data?.avatarUrl ?? avatarUrl);
      setProfile({
        ...profile,
        avatarUrl: response.data?.avatarUrl ?? avatarUrl,
      });
      Alert.alert('Сәтті', 'Аватар жаңартылды.');
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const resolvedDisplayName = useMemo(
    () => displayName || firstName || profile?.firstName || 'Фермер',
    [displayName, firstName, profile?.firstName],
  );

  return (
    <UserProfileView
      mode="edit"
      displayName={resolvedDisplayName}
      avatarUrl={avatarUrl}
      bio={bio}
      phone={phone}
      farmName={farmName}
      regionName={selectedRegion?.name ?? profile?.regionName ?? null}
      districtName={selectedDistrict?.name ?? profile?.districtName ?? null}
      settlementName={selectedSettlement?.name ?? profile?.settlementName ?? null}
      displayNameValue={displayName}
      firstNameValue={firstName}
      phoneValue={phone}
      farmNameValue={farmName}
      settlementNameValue={selectedSettlement?.name ?? ''}
      bioValue={bio}
      publicProfile={publicProfile}
      selectedRegion={selectedRegion}
      selectedDistrict={selectedDistrict}
      districtHelperText={districtsError}
      showManualDistrictInput={districtsEmpty}
      manualDistrictValue={manualDistrictName}
      onChangeManualDistrict={setManualDistrictName}
      onOpenRegion={() => {
        setShowRegionSheet(true);
        if (!regions.length) {
          loadRegions();
        }
      }}
      onOpenDistrict={() => {
        if (!selectedRegion?.id) {
          setDistrictsError('Алдымен облыс таңдаңыз.');
          return;
        }
        setShowDistrictSheet(true);
        if (!districts.length) {
          loadDistricts(selectedRegion.id);
        }
      }}
      onOpenSettlement={() => {
        if (!selectedDistrict) return;
        setShowSettlementSheet(true);
        if (!settlements.length) {
          loadSettlements(selectedDistrict.id);
        }
      }}
      onChangeDisplayName={setDisplayName}
      onChangeFirstName={setFirstName}
      onChangePhone={setPhone}
      onChangeFarmName={setFarmName}
      onChangeBio={setBio}
      onTogglePublicProfile={setPublicProfile}
      onPickAvatar={pickAvatar}
      onSave={onSave}
      loading={loading}
    >
      <BottomSheetSelect
        visible={showRegionSheet}
        title="Облыс таңдау"
        options={regions}
        onClose={() => setShowRegionSheet(false)}
        onSelect={(item) => {
          setShowRegionSheet(false);
          setSelectedRegion(item);
          setRegionIdValue(item.id);
          setSelectedDistrict(null);
          setDistrictIdValue(null);
          setSelectedSettlement(null);
          setSettlementIdValue(null);
          setSettlements([]);
          setDistricts([]);
          setDistrictsError(null);
          setDistrictsEmpty(false);
          setManualDistrictName('');
          loadDistricts(item.id);
        }}
      />
      <BottomSheetSelect
        visible={showDistrictSheet}
        title="Аудан таңдау"
        options={districts}
        allowCreate
        onCreate={(name) => {
          setShowDistrictSheet(false);
          setManualDistrictName(name);
        }}
        emptyMessage={districtsError ?? undefined}
        onClose={() => setShowDistrictSheet(false)}
        onSelect={(item) => {
          setShowDistrictSheet(false);
          setSelectedDistrict(item);
          setDistrictIdValue(item.id);
          setSelectedSettlement(null);
          setSettlementIdValue(null);
          setSettlements([]);
          setManualDistrictName('');
          setDistrictsError(null);
          loadSettlements(item.id);
        }}
      />
      <BottomSheetSelect
        visible={showSettlementSheet}
        title="Ауыл таңдау"
        options={settlements}
        allowCreate
        onCreate={onAddVillage}
        searchPlaceholder="Ауыл іздеу..."
        onSearchChange={(q) => {
          setVillageSearch(q);
        }}
        emptyMessage={settlementsError ?? undefined}
        onClose={() => setShowSettlementSheet(false)}
        onSelect={(item) => {
          setShowSettlementSheet(false);
          setSelectedSettlement(item);
          setSettlementIdValue(item.id);
        }}
      />
      <Text style={{ marginBottom: 8, fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
        Мекенжай
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 10,
          marginBottom: 12,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        }}
        value={addressText}
        onChangeText={setAddressText}
        placeholder="Мекенжай"
        placeholderTextColor={theme.colors.placeholder}
      />
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 10,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
        onPress={() => setShowMapPicker(true)}
      >
        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Картадан таңдау</Text>
      </TouchableOpacity>
      {lat && lng ? (
        <Text style={{ color: theme.colors.mutedText, fontSize: 12, marginBottom: 12 }}>
          Таңдалды: {lat}, {lng}
        </Text>
      ) : (
        <Text style={{ color: theme.colors.warning ?? theme.colors.mutedText, fontSize: 12, marginBottom: 12 }}>
          Картадан мекенжай таңдаңыз
        </Text>
      )}
      <MapPicker
        visible={showMapPicker}
        title="Үй мекенжайы"
        initialLat={lat ? Number(lat) : undefined}
        initialLng={lng ? Number(lng) : undefined}
        onPick={(coords) => {
          setLat(coords.lat.toFixed(6));
          setLng(coords.lng.toFixed(6));
        }}
        onClose={() => setShowMapPicker(false)}
      />
    </UserProfileView>
  );
}
