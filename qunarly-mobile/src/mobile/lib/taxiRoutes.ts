import api from '@/lib/api/client';

type EnsureRouteInput = {
  originHubId: string;
  destHubId: string;
  routeType?: 'VILLAGE_TO_DISTRICT' | 'DISTRICT_TO_CITY' | 'VILLAGE_TO_CITY';
};

export async function ensureRoute(input: EnsureRouteInput) {
  const response = await api.post('/taxi/routes/ensure', input);
  return response.data;
}
