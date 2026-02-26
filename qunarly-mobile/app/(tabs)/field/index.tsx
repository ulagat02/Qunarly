import { useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';
import { parseApiError } from '@/lib/api/errors';
import { useTheme } from '@/src/mobile/theme';
import FloatingActionButton from '@/src/mobile/components/FloatingActionButton';
import { CropsIcon } from '@/src/mobile/components/AppIcons';

type ServiceType = {
  id: string;
  name: string;
  baseRate: number;
};

type FieldJob = {
  id: string;
  farmerId: string;
  acceptedBy?: string | null;
  areaHa: number;
  lat: number;
  lng: number;
  priceEstimate: number;
  status: string;
  serviceType?: ServiceType | null;
};

export default function AlapListScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<FieldJob[]>([]);
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

  const loadJobs = async () => {
    try {
      const response = await api.get('/field/jobs');
      setJobs(response.data ?? []);
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
    loadJobs();
  }, []);

  const acceptJob = async (jobId: string) => {
    try {
      await api.post(`/field/jobs/${jobId}/accept`);
      Alert.alert('Сәтті', 'Жұмыс қабылданды.');
      loadJobs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const startJob = async (jobId: string) => {
    try {
      await api.post(`/field/jobs/${jobId}/start`);
      Alert.alert('Сәтті', 'Жұмыс басталды.');
      loadJobs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const completeJob = async (jobId: string) => {
    try {
      await api.post(`/field/jobs/${jobId}/complete`);
      Alert.alert('Сәтті', 'Жұмыс аяқталды.');
      loadJobs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      await api.post(`/field/jobs/${jobId}/cancel`);
      Alert.alert('Сәтті', 'Жұмыс тоқтатылды.');
      loadJobs();
    } catch (error: any) {
      const info = parseApiError(error);
      Alert.alert('Қате', info.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'BROADCASTED':
        return 'Ашық';
      case 'ACCEPTED':
        return 'Қабылданды';
      case 'IN_PROGRESS':
        return 'Жүріп жатыр';
      case 'COMPLETED':
        return 'Аяқталды';
      case 'CANCELLED':
        return 'Тоқтатылды';
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
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ашық жұмыстар</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadJobs}>
              <Text style={styles.refreshText}>Жаңарту</Text>
            </TouchableOpacity>
          </View>
          {jobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CropsIcon size={26} color={theme.colors.mutedText} />
              <Text style={styles.emptyTitle}>Әзірге жұмыс жоқ</Text>
              <Text style={styles.emptyText}>Жаңа жұмыс шықса, осы жерден көресіз.</Text>
            </View>
          ) : (
            jobs.map((job) => {
              const isExecutor = role === 'EXECUTOR';
              const isOwner = userId && job.farmerId === userId;
              const isAcceptedByMe = userId && job.acceptedBy === userId;
              const canAccept = isExecutor && job.status === 'BROADCASTED';
              const canStart = isExecutor && isAcceptedByMe && job.status === 'ACCEPTED';
              const canComplete = isExecutor && isAcceptedByMe && job.status === 'IN_PROGRESS';
              const canCancel =
                role === 'FARMER' && isOwner && !['COMPLETED', 'CANCELLED'].includes(job.status);

              return (
                <View key={job.id} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {job.serviceType?.name ?? job.serviceType?.id ?? 'Қызмет'}
                  </Text>
                  <Text style={styles.cardText}>Аумағы: {job.areaHa} га</Text>
                  <Text style={styles.cardText}>
                    Бағасы: {job.priceEstimate.toLocaleString('kk-KZ')} ₸
                  </Text>
                  <Text style={styles.cardText}>Күйі: {getStatusLabel(job.status)}</Text>

                  <View style={styles.actionsRow}>
                    {canAccept ? (
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => acceptJob(job.id)}>
                        <Text style={styles.secondaryText}>Қабылдау</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canStart ? (
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => startJob(job.id)}>
                        <Text style={styles.secondaryText}>Бастау</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canComplete ? (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => completeJob(job.id)}
                      >
                        <Text style={styles.secondaryText}>Аяқтау</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canCancel ? (
                      <TouchableOpacity style={styles.dangerButton} onPress={() => cancelJob(job.id)}>
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

      {role === 'FARMER' ? (
        <FloatingActionButton
          label="+ Жұмыс қосу"
          onPress={() => router.push('/(tabs)/field/create')}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
