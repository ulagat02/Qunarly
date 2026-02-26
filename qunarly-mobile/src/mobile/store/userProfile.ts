import { useEffect, useState } from 'react';
import api from '@/lib/api/client';
import { getSession } from '@/lib/auth/session';

export type UserProfile = {
  firstName?: string | null;
  name?: string | null;
  displayName?: string | null;
  bio?: string | null;
  publicProfile?: boolean | null;
  ratingStats?: { rating?: number; reviewsCount?: number } | null;
  phone?: string | null;
  regionId?: string | null;
  regionName?: string | null;
  districtId?: string | null;
  districtName?: string | null;
  settlementId?: string | null;
  settlementName?: string | null;
  farmName?: string | null;
  avatarUrl?: string | null;
  addressText?: string | null;
  lat?: number | null;
  lng?: number | null;
  homeUpdatedAt?: string | null;
  role?: string | null;
  userId?: string | null;
};

let cachedProfile: UserProfile | null = null;
const subscribers = new Set<(profile: UserProfile | null) => void>();

export function setUserProfile(profile: UserProfile | null) {
  cachedProfile = profile;
  subscribers.forEach((handler) => handler(cachedProfile));
}

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    subscribers.add(setProfileState);
    return () => {
      subscribers.delete(setProfileState);
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const session = await getSession();
      const response = await api.get('/profiles/me');
      setUserProfile({
        ...response.data,
        role: session.role,
        userId: session.userId,
      });
    } catch (error) {
      console.log('[ProfileStore] refresh failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedProfile) {
      refresh();
    }
  }, []);

  return { profile, loading, refresh, setProfile: setUserProfile };
}
