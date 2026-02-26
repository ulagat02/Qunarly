import 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Modal, Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api/client';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { getAccessToken } from '@/lib/auth/token';

import { ThemeProvider, useTheme } from '@/src/mobile/theme';
import { useRouter, usePathname } from 'expo-router';
import { useMeActive, isTripsPathAllowed } from '@/src/mobile/hooks/useMeActive';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { theme, colorScheme } = useTheme();
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <ActiveRedirect />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="taxi" options={{ headerShown: false }} />
        <Stack.Screen name="trips" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Profil' }} />
        <Stack.Screen name="map" options={{ title: 'Агро карта' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <GlobalDriverQueuePrompt />
      <GlobalPushNotifications />
    </NavigationThemeProvider>
  );
}

function ActiveRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTripSession, activeBooking, loading } = useMeActive();

  useEffect(() => {
    if (loading) return;
    if (pathname?.includes('(auth)')) return;
    if (isTripsPathAllowed(pathname ?? '')) return;

    if (activeBooking?.trip?.id) {
      router.replace(`/trips/passenger/${activeBooking.trip.id}`);
      return;
    }
    if (activeTripSession?.id) {
      router.replace(`/trips/driver/${activeTripSession.id}`);
      return;
    }
  }, [loading, activeTripSession, activeBooking, pathname, router]);

  return null;
}

function GlobalPushNotifications() {
  const router = useRouter();
  const registeringRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const registerPushToken = async () => {
      if (!Constants.isDevice || Platform.OS === 'web') return;
      if (registeringRef.current) return;
      registeringRef.current = true;
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) return;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const request = await Notifications.requestPermissionsAsync();
          finalStatus = request.status;
        }
        if (finalStatus !== 'granted') return;
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId ?? undefined;
        const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        const token = tokenResponse?.data;
        if (!token || cancelled) return;
        const storedToken = await AsyncStorage.getItem('push_token_registered');
        if (storedToken === token) return;
        await api.post('/notifications/push-token', { token });
        await AsyncStorage.setItem('push_token_registered', token);
      } catch (error) {
        console.log('[Push] token register failed', error);
      } finally {
        registeringRef.current = false;
      }
    };
    void registerPushToken();
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void registerPushToken();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string } | undefined;
      if (data?.type === 'TAXI_OFFER') {
        router.push('/taxi/driver');
      }
    });
    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  return null;
}

function GlobalDriverQueuePrompt() {
  const { theme } = useTheme();
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  const cleanupQueue = async (routeId: string) => {
    await Promise.all([
      AsyncStorage.removeItem(`driver_queue_joined_at_${routeId}`),
      AsyncStorage.removeItem(`driver_queue_prompt_count_${routeId}`),
      AsyncStorage.removeItem(`driver_queue_last_prompt_${routeId}`),
      AsyncStorage.removeItem('driver_queue_active_route'),
    ]);
  };

  useEffect(() => {
    let isMounted = true;
    const tick = async () => {
      const routeId = await AsyncStorage.getItem('driver_queue_active_route');
      if (!routeId) {
        if (isMounted) setShowPrompt(false);
        return;
      }
      if (isMounted) setActiveRouteId(routeId);
      try {
        const queueResponse = await api.get('/drivers/queue/status', { params: { routeId } });
        const queue = queueResponse.data?.queue;
        if (!queue || queue.status !== 'IN_QUEUE') {
          await cleanupQueue(routeId);
          if (isMounted) setShowPrompt(false);
          return;
        }
        const joinedAtValue = queue.joinedAt ? new Date(queue.joinedAt).getTime() : null;
        if (joinedAtValue) {
          await AsyncStorage.setItem(`driver_queue_joined_at_${routeId}`, String(joinedAtValue));
        }
        const joinedAtRaw = await AsyncStorage.getItem(`driver_queue_joined_at_${routeId}`);
        const joinedAt = joinedAtRaw ? Number(joinedAtRaw) : null;
        if (!joinedAt) return;
        const now = Date.now();
        const elapsed = now - joinedAt;
        const promptCount = Number(await AsyncStorage.getItem(`driver_queue_prompt_count_${routeId}`) ?? '0');
        const lastPromptAt = Number(await AsyncStorage.getItem(`driver_queue_last_prompt_${routeId}`) ?? '0');
        if (elapsed >= 15 * 60 * 1000 && promptCount < 3 && now - lastPromptAt >= 5 * 60 * 1000) {
          await Promise.all([
            AsyncStorage.setItem(`driver_queue_prompt_count_${routeId}`, String(promptCount + 1)),
            AsyncStorage.setItem(`driver_queue_last_prompt_${routeId}`, String(now)),
          ]);
          if (isMounted) setShowPrompt(true);
        }
      } catch (error) {
        console.log('[GlobalPrompt] queue status failed', error);
        if (isMounted) {
          setShowPrompt(false);
        }
      }
    };
    tick();
    const timer = setInterval(tick, 60000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleLeaveQueue = async () => {
    if (!activeRouteId) return;
    try {
      await api.post('/drivers/queue/inactive', { routeId: activeRouteId });
      await cleanupQueue(activeRouteId);
      setShowPrompt(false);
    } catch (error) {
      console.log('[GlobalPrompt] leave failed', error);
    }
  };

  return (
    <Modal visible={showPrompt} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            width: '100%',
            borderRadius: 16,
            padding: 16,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 16 }}>Жүрдің бе?</Text>
          <Text style={{ color: '#6B7280', marginTop: 6 }}>
            Егер шықсаң, кезектен автомат шығасың.
          </Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: theme.colors.primary,
              }}
              onPress={handleLeaveQueue}
            >
              <Text style={{ color: theme.colors.surface, fontWeight: '600' }}>ЖҮРДІМ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                backgroundColor: theme.colors.background,
              }}
              onPress={() => setShowPrompt(false)}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>ЖҮРМЕДІМ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
