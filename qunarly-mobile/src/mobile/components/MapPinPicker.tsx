import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '@/src/mobile/theme';

type MapPinPickerProps = {
  visible: boolean;
  title: string;
  initialLat?: number;
  initialLng?: number;
  onPick: (coords: { lat: number; lng: number }) => void;
  onClose: () => void;
};

export default function MapPinPicker({
  visible,
  title,
  initialLat,
  initialLng,
  onPick,
  onClose,
}: MapPinPickerProps) {
  const { theme } = useTheme();
  const [region, setRegion] = useState({
    latitude: initialLat || 43.2389,
    longitude: initialLng || 76.8897,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: theme.colors.primary }}>Жабу</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={(r) => setRegion(r)}
          />
          <View style={styles.pinOverlay} pointerEvents="none">
            <View style={[styles.pin, { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.pinLeg, { backgroundColor: theme.colors.primary }]} />
          </View>
        </View>

        <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.coords, { color: theme.colors.mutedText }]}>
            {region.latitude.toFixed(6)}, {region.longitude.toFixed(6)}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => onPick({ lat: region.latitude, lng: region.longitude })}
          >
            <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>
              Осы жерді таңдау
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -30,
    alignItems: 'center',
  },
  pin: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pinLeg: {
    width: 2,
    height: 15,
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  coords: {
    textAlign: 'center',
    fontSize: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});
