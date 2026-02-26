import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import api from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/token';

type Hub = { id: string; name?: string; lat?: number; lng?: number };

type TripSession = {
  id: string;
  driverId: string;
  routeId: string;
  status: string;
  totalSeats: number;
  bookedSeats: number;
  expiresAt?: string | null;
  closingUntil?: string | null;
  route?: { fromHub?: Hub; toHub?: Hub };
  driver?: { id: string; displayName?: string | null; phone?: string | null };
  bookings?: { passengerId: string; seatCount: number }[];
};

type TripBooking = {
  id: string;
  tripId: string;
  passengerId: string;
  seatCount: number;
  status: string;
  trip?: TripSession;
};

export type MeActive = {
  activeTripSession: TripSession | null;
  activeBooking: TripBooking | null;
};

const ALLOWED_PATHS = [
  '/profile',
  '/help',
  '/security',
  '/trips/passenger/',
  '/trips/driver/',
];

export function useMeActive() {
  const [data, setData] = useState<MeActive>({
    activeTripSession: null,
    activeBooking: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setData({ activeTripSession: null, activeBooking: null });
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<MeActive>('/me/active');
      setData(res.data ?? { activeTripSession: null, activeBooking: null });
    } catch {
      setData({ activeTripSession: null, activeBooking: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { ...data, loading, refresh };
}

export function isTripsPathAllowed(pathname: string): boolean {
  const p = pathname?.startsWith('/') ? pathname : `/${pathname}`;
  return ALLOWED_PATHS.some((base) => p === base || p.startsWith(base));
}
