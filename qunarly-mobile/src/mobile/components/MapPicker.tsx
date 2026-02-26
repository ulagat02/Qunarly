import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '@/src/mobile/theme';

const mapsModule = Platform.OS === 'web' ? null : require('react-native-maps');
const MapView = mapsModule ? mapsModule.default : null;
const Marker = mapsModule ? mapsModule.Marker : null;
const UrlTile = mapsModule ? mapsModule.UrlTile : null;

type MapPickerProps = {
  visible: boolean;
  title?: string;
  initialLat?: number;
  initialLng?: number;
  onPick: (coords: { lat: number; lng: number }) => void;
  onClose: () => void;
};

export default function MapPicker({
  visible,
  title = 'Картадан таңдаңыз',
  initialLat,
  initialLng,
  onPick,
  onClose,
}: MapPickerProps) {
  const { theme } = useTheme();
  const [region, setRegion] = useState({
    latitude: initialLat ?? 43.238949,
    longitude: initialLng ?? 76.889709,
    latitudeDelta: 0.25,
    longitudeDelta: 0.25,
  });
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null,
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setRegion((prev) => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    })();
  }, [visible]);

  useEffect(() => {
    if (initialLat && initialLng) {
      setRegion((prev) => ({
        ...prev,
        latitude: initialLat,
        longitude: initialLng,
      }));
      setMarker({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          paddingTop: Platform.OS === 'ios' ? 48 : 20,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        title: {
          color: theme.colors.text,
          fontWeight: '700',
          fontSize: 16,
        },
        map: {
          flex: 1,
        },
        footer: {
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        hint: {
          color: theme.colors.mutedText,
          marginBottom: 8,
        },
        button: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: 'center',
        },
        buttonText: {
          color: theme.colors.surface,
          fontWeight: '700',
        },
        secondaryButton: {
          marginTop: 8,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: 'center',
        },
        secondaryText: {
          color: theme.colors.text,
          fontWeight: '600',
        },
        placeholder: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        },
        placeholderText: {
          color: theme.colors.mutedText,
        },
      }),
    [theme],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        {MapView && UrlTile ? (
          <MapView
            style={styles.map}
            region={region}
            onLongPress={(event: any) => {
              const { latitude, longitude } = event.nativeEvent.coordinate;
              setMarker({ lat: latitude, lng: longitude });
              setRegion((prev) => ({
                ...prev,
                latitude,
                longitude,
              }));
            }}
          >
            <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
            {marker && Marker ? <Marker coordinate={{ latitude: marker.lat, longitude: marker.lng }} /> : null}
          </MapView>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Карта web-та қолжетімсіз</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.hint}>Ұзақ басып белгі қойыңыз</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!marker) {
                return;
              }
              onPick(marker);
              onClose();
            }}
          >
            <Text style={styles.buttonText}>Таңдау</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryText}>Жабу</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
