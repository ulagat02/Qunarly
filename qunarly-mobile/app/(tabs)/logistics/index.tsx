import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';
import FloatingActionButton from '@/src/mobile/components/FloatingActionButton';
import { DeliveryProgressIcon, PackageIcon } from '@/src/mobile/components/AppIcons';

type ShipmentJob = {
  id: string;
  requesterId: string;
  acceptedBy?: string | null;
  dealId?: string | null;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  distanceKm?: number | null;
  cargoWeightKg?: number | null;
  cargoVolumeM3?: number | null;
  cargoType?: string | null;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  status: string;
  cargoJson: any;
};

type DeliveryLeg = {
  id: string;
  orderId: string;
  deliveryId?: string | null;
  fromLocation: string;
  toLocation: string;
  price: number;
  status: string;
  driverId?: string | null;
};


export default function TasymalListScreen() {
  const router = useRouter();
  const [shipments, setShipments] = useState<ShipmentJob[]>([]);
  const [availableLegs, setAvailableLegs] = useState<DeliveryLeg[]>([]);
  const [myLegs, setMyLegs] = useState<DeliveryLeg[]>([]);
  const [recommendedCarriers, setRecommendedCarriers] = useState<any[]>([]);
  const [latestShipmentId, setLatestShipmentId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          flex: 1,
          backgroundColor: theme.colors.background,
          position: 'relative',
        },
        container: {
          padding: 16,
          paddingBottom: tabBarHeight + insets.bottom + 120,
          backgroundColor: theme.colors.background,
        },
        title: {
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 16,
          color: theme.colors.text,
        },
        section: {
          marginBottom: 20,
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.text,
        },
        refreshButton: {
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 6,
        },
        refreshText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        empty: {
          color: theme.colors.mutedText,
          textAlign: 'center',
          marginTop: 20,
        },
        emptyContainer: {
          alignItems: 'center',
          gap: 6,
          marginTop: 20,
        },
        emptyTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
        },
        emptyText: {
          fontSize: 13,
          color: theme.colors.mutedText,
          textAlign: 'center',
        },
        card: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
          backgroundColor: theme.colors.surface,
        },
        cardTitle: {
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 6,
          color: theme.colors.text,
        },
        cardText: {
          color: theme.colors.mutedText,
          marginBottom: 4,
        },
        actionsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 8,
        },
        secondaryButton: {
          borderWidth: 1,
          borderColor: theme.colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
        },
        secondaryText: {
          color: theme.colors.primary,
          fontWeight: '600',
        },
        dangerButton: {
          borderWidth: 1,
          borderColor: theme.colors.danger,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
        },
        dangerText: {
          color: theme.colors.danger,
          fontWeight: '600',
        },
      }),
    [theme, tabBarHeight, insets.bottom],
  );

  const loadShipments = async () => {
    try {
      const response = await api.get('/logistics/shipments');
      setShipments(response.data ?? []);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const loadRecommendations = async (shipmentId?: string) => {
    if (!shipmentId) {
      setRecommendedCarriers([]);
      return;
    }
    try {
      const response = await api.get(`/logistics/shipments/${shipmentId}/recommendations`);
      setRecommendedCarriers(response.data ?? []);
    } catch {
      setRecommendedCarriers([]);
    }
  };


  const loadLegs = async () => {
    if (role !== 'CARRIER') {
      setAvailableLegs([]);
      setMyLegs([]);
      return;
    }
    try {
      const [availableResponse, myResponse] = await Promise.all([
        api.get('/delivery/legs/available'),
        api.get('/delivery/legs/mine'),
      ]);
      setAvailableLegs(availableResponse.data ?? []);
      setMyLegs(myResponse.data ?? []);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  useEffect(() => {
    getSession().then((session) => {
      setRole(session.role);
      setUserId(session.userId);
    });
    loadShipments();
  }, []);

  useEffect(() => {
    if (role === 'BUYER' || role === 'FARMER') {
      const latest = shipments[0];
      setLatestShipmentId(latest?.id ?? null);
      loadRecommendations(latest?.id);
    }
  }, [role, shipments]);

  useFocusEffect(
    useCallback(() => {
      loadLegs();
    }, [role]),
  );

  useEffect(() => {
    loadLegs();
  }, [role]);

  const acceptShipment = async (shipmentId: string) => {
    try {
      await api.post(`/logistics/shipments/${shipmentId}/accept`);
      Alert.alert('Сәтті', 'Тасымал қабылданды.');
      loadShipments();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const pickupStart = async (shipmentId: string) => {
    try {
      await api.post(`/logistics/shipments/${shipmentId}/pickup-start`);
      Alert.alert('Сәтті', 'Жүк алу басталды.');
      loadShipments();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const inTransit = async (shipmentId: string) => {
    try {
      await api.post(`/logistics/shipments/${shipmentId}/in-transit`);
      Alert.alert('Сәтті', 'Тасымалда.');
      loadShipments();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const deliver = async (shipmentId: string) => {
    try {
      await api.post(`/logistics/shipments/${shipmentId}/deliver`);
      Alert.alert('Сәтті', 'Жеткізілді.');
      loadShipments();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const cancelShipment = async (shipmentId: string) => {
    try {
      await api.post(`/logistics/shipments/${shipmentId}/cancel`);
      Alert.alert('Сәтті', 'Тасымал тоқтатылды.');
      loadShipments();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const acceptLeg = async (legId: string) => {
    try {
      await api.post(`/delivery/legs/${legId}/accept`);
      Alert.alert('Сәтті', 'Эстафета қабылданды.');
      loadLegs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const assignCarrier = async (carrierId: string) => {
    if (!latestShipmentId) {
      return;
    }
    try {
      await api.post(`/logistics/shipments/${latestShipmentId}/assign`, { carrierId });
      Alert.alert('Сәтті', 'Жеткізуші тағайындалды.');
      loadShipments();
      loadRecommendations(latestShipmentId);
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const rejectLeg = async (legId: string) => {
    try {
      await api.post(`/delivery/legs/${legId}/reject`);
      Alert.alert('Сәтті', 'Қабылданбады.');
      loadLegs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const startLeg = async (legId: string) => {
    try {
      await api.post(`/delivery/legs/${legId}/start`);
      Alert.alert('Сәтті', 'Жолға шықты.');
      loadLegs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const completeLeg = async (legId: string) => {
    try {
      await api.post(`/delivery/legs/${legId}/complete`);
      Alert.alert('Сәтті', 'Кезең аяқталды.');
      loadLegs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'Құрылған';
      case 'ASSIGNED':
        return 'Тағайындалды';
      case 'OFFERED':
        return 'Ұсынылды';
      case 'PICKED_UP':
        return 'Жүк алынды';
      case 'IN_TRANSIT':
        return 'Тасымалда';
      case 'DELIVERED':
        return 'Жеткізілді';
      case 'CANCELLED':
        return 'Тоқтатылды';
      default:
        return status;
    }
  };

  const getLegStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Күтілуде';
      case 'IN_PROGRESS':
        return 'Тасымалда';
      case 'HANDED_OFF':
        return 'Тапсырылды';
      case 'COMPLETED':
        return 'Аяқталды';
      default:
        return status;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {(role === 'BUYER' || role === 'FARMER') && recommendedCarriers.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ұсынылатын жеткізушілер</Text>
            {recommendedCarriers.map((carrier) => (
              <View key={carrier.id} style={styles.card}>
                <Text style={styles.cardTitle}>{carrier.displayName}</Text>
                <Text style={styles.cardText}>Көлік: {carrier.vehicleType ?? '—'}</Text>
                <Text style={styles.cardText}>
                  Аймақ: {carrier.homeRegion ?? 'Белгісіз'}
                </Text>
                <Text style={styles.cardText}>
                  Қашықтық: {carrier.distanceKm ?? '—'} км
                </Text>
                <Text style={styles.cardText}>
                  Макс салмақ: {carrier.maxWeightKg} кг
                </Text>
                <Text style={styles.cardText}>
                  Макс көлем: {carrier.maxVolumeM3 ?? '—'} м3
                </Text>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => assignCarrier(carrier.id)}>
                    <Text style={styles.secondaryText}>Қабылдату</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {role === 'CARRIER' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Эстафета тапсырмалары</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={loadLegs}>
                <Text style={styles.refreshText}>Жаңарту</Text>
              </TouchableOpacity>
            </View>
            {availableLegs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <DeliveryProgressIcon size={26} color={theme.colors.mutedText} />
                <Text style={styles.emptyTitle}>Қолжетімді кезең жоқ</Text>
                <Text style={styles.emptyText}>Жаңа кезең ашылса, осында көресіз.</Text>
              </View>
            ) : (
              availableLegs.map((leg) => (
                <View key={leg.id} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {leg.fromLocation} → {leg.toLocation}
                  </Text>
                  <Text style={styles.cardText}>Бағасы: {leg.price?.toLocaleString('kk-KZ')} ₸</Text>
                  <Text style={styles.cardText}>Күйі: {getLegStatusLabel(leg.status)}</Text>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => acceptLeg(leg.id)}>
                      <Text style={styles.secondaryText}>Қабылдау</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            {myLegs.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Менің кезеңдерім</Text>
                {myLegs.map((leg) => {
                  const canComplete = leg.status === 'IN_PROGRESS';
                  const canReject = leg.status === 'PENDING';
                  const canShowQr = leg.status === 'PENDING' || leg.status === 'IN_PROGRESS';
                  const canScan = leg.status === 'IN_PROGRESS';
                  return (
                    <View key={leg.id} style={styles.card}>
                      <Text style={styles.cardTitle}>
                        {leg.fromLocation} → {leg.toLocation}
                      </Text>
                      <Text style={styles.cardText}>Күйі: {getLegStatusLabel(leg.status)}</Text>
                      {leg.deliveryId ? (
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => router.push({ pathname: '/map', params: { deliveryId: leg.deliveryId } })}
                        >
                          <Text style={styles.secondaryText}>Картада көру</Text>
                        </TouchableOpacity>
                      ) : null}
                      <View style={styles.actionsRow}>
                        {canComplete ? (
                          <TouchableOpacity style={styles.secondaryButton} onPress={() => completeLeg(leg.id)}>
                            <Text style={styles.secondaryText}>Аяқтау</Text>
                          </TouchableOpacity>
                        ) : null}
                        {canShowQr ? (
                          <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() =>
                              router.push({ pathname: '/logistics/handoff-receive', params: { legId: leg.id } })
                            }
                          >
                            <Text style={styles.secondaryText}>Қабылдау QR</Text>
                          </TouchableOpacity>
                        ) : null}
                        {canScan ? (
                          <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/logistics/handoff-send')}
                          >
                            <Text style={styles.secondaryText}>Сканерлеп тапсыру</Text>
                          </TouchableOpacity>
                        ) : null}
                        {canReject ? (
                          <TouchableOpacity style={styles.dangerButton} onPress={() => rejectLeg(leg.id)}>
                            <Text style={styles.dangerText}>Бас тарту</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Тасымалдар</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadShipments}>
              <Text style={styles.refreshText}>Жаңарту</Text>
            </TouchableOpacity>
          </View>
          {shipments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <PackageIcon size={26} color={theme.colors.mutedText} />
              <Text style={styles.emptyTitle}>Тізім бос</Text>
              <Text style={styles.emptyText}>Жаңа тасымал шықса, осында көресіз.</Text>
            </View>
          ) : (
            shipments.map((shipment) => {
              const isCarrier = role === 'CARRIER';
              const isOwner = userId && shipment.requesterId === userId;
              const isAcceptedByMe = userId && shipment.acceptedBy === userId;
              const canAccept = isCarrier && shipment.status === 'OFFERED';
              const canPickup = isCarrier && isAcceptedByMe && shipment.status === 'ASSIGNED';
              const canTransit = isCarrier && isAcceptedByMe && shipment.status === 'PICKED_UP';
              const canDeliver = isCarrier && isAcceptedByMe && shipment.status === 'IN_TRANSIT';
              const canCancel = isOwner && !['DELIVERED', 'CANCELLED'].includes(shipment.status);

              return (
                <View key={shipment.id} style={styles.card}>
                  <Text style={styles.cardTitle}>Тасымал #{shipment.id.slice(0, 6)}</Text>
                  <Text style={styles.cardText}>Күйі: {getStatusLabel(shipment.status)}</Text>
                  {shipment.dealId ? <Text style={styles.cardText}>Келісім: {shipment.dealId}</Text> : null}
                  <Text style={styles.cardText}>
                    Жүк: {shipment.cargoJson?.description ?? '—'}
                  </Text>
                  <Text style={styles.cardText}>
                    Салмақ: {shipment.cargoWeightKg ?? shipment.cargoJson?.weightKg ?? '—'} кг
                  </Text>
                  <Text style={styles.cardText}>
                    Көлем: {shipment.cargoVolumeM3 ?? shipment.cargoJson?.volumeM3 ?? '—'} м3
                  </Text>
                  <Text style={styles.cardText}>
                    Қашықтық: {shipment.distanceKm ?? '—'} км
                  </Text>
                  <Text style={styles.cardText}>
                    Бағасы: {(shipment.finalPrice ?? shipment.estimatedPrice ?? 0).toLocaleString('kk-KZ')} ₸
                  </Text>

                  <View style={styles.actionsRow}>
                    {canAccept ? (
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => acceptShipment(shipment.id)}>
                        <Text style={styles.secondaryText}>
                          Қабылдау • {(shipment.estimatedPrice ?? 0).toLocaleString('kk-KZ')} ₸
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {canPickup ? (
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => pickupStart(shipment.id)}>
                        <Text style={styles.secondaryText}>Жүк алу</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canTransit ? (
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => inTransit(shipment.id)}>
                        <Text style={styles.secondaryText}>Тасымалда</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canDeliver ? (
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => deliver(shipment.id)}>
                        <Text style={styles.secondaryText}>Жеткізу</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canCancel ? (
                      <TouchableOpacity style={styles.dangerButton} onPress={() => cancelShipment(shipment.id)}>
                        <Text style={styles.dangerText}>Тоқтату</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {role && ['BUYER', 'FARMER', 'ADMIN'].includes(role) ? (
        <FloatingActionButton
          label="+ Тасымал қосу"
          onPress={() => router.push('/(tabs)/logistics/create')}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
