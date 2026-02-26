import Constants from 'expo-constants';

export type GeocodingResult = {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  kind?: 'house' | 'street' | 'place';
};

export type GeocodingProvider = {
  search: (
    query: string,
    options?: { viewbox?: [number, number, number, number] },
  ) => Promise<GeocodingResult[]>;
};

const cache = new Map<string, GeocodingResult[]>();

const buildSubtitle = (address: Record<string, string> | undefined) => {
  if (!address) {
    return '';
  }
  const parts = [
    address.state,
    address.county,
    address.city,
    address.town,
    address.village,
    address.suburb,
  ].filter(Boolean);
  return parts.join(', ');
};

const buildCacheKey = (query: string, viewbox?: [number, number, number, number]) => {
  if (!viewbox) {
    return query;
  }
  return `${query}|${viewbox.map((v) => v.toFixed(3)).join(',')}`;
};

const parseStreetAndHouse = (query: string) => {
  const match = query.match(/^(.*?)(\s+\d+[A-Za-zА-Яа-я\-]*)$/);
  if (!match) {
    return null;
  }
  const street = match[1].trim();
  const houseNumber = match[2].trim();
  if (!street || !houseNumber) {
    return null;
  }
  return { street, houseNumber };
};

const getTypeRank = (type: string | undefined) => {
  if (!type) return 3;
  if (type.includes('house') || type.includes('building')) return 0;
  if (type.includes('residential') || type.includes('road') || type.includes('street')) return 1;
  return 2;
};

const getApiKey = () => {
  const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey;
  return typeof apiKey === 'string' ? apiKey : '';
};

const mapPlaceKind = (types: string[] | undefined) => {
  if (!types?.length) return 'place' as const;
  if (types.some((type) => ['street_address', 'premise', 'subpremise', 'establishment'].includes(type))) {
    return 'house' as const;
  }
  if (types.some((type) => ['route', 'street_number', 'intersection'].includes(type))) {
    return 'street' as const;
  }
  return 'place' as const;
};

const buildLocationBias = (viewbox?: [number, number, number, number]) => {
  if (!viewbox) return undefined;
  const [minLng, minLat, maxLng, maxLat] = viewbox;
  return {
    rectangle: {
      low: { latitude: minLat, longitude: minLng },
      high: { latitude: maxLat, longitude: maxLng },
    },
  };
};

export const googlePlacesProvider: GeocodingProvider = {
  async search(query: string, options?: { viewbox?: [number, number, number, number] }) {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    const cacheKey = buildCacheKey(trimmed, options?.viewbox);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) ?? [];
    }
    const apiKey = getApiKey();
    if (!apiKey) {
      return [];
    }
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
      },
      body: JSON.stringify({
        textQuery: trimmed,
        languageCode: 'kk',
        regionCode: 'KZ',
        locationBias: buildLocationBias(options?.viewbox),
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Places search failed: ${response.status} ${text}`);
    }
    const data = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        types?: string[];
      }>;
    };
    const results =
      data.places?.map((place) => {
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        return {
          id: place.id ?? `${trimmed}-${Math.random().toString(36).slice(2, 8)}`,
          title: place.displayName?.text || place.formattedAddress || trimmed,
          subtitle: place.formattedAddress || '',
          lat: typeof lat === 'number' ? lat : 0,
          lng: typeof lng === 'number' ? lng : 0,
          kind: mapPlaceKind(place.types),
        };
      }) ?? [];
    const filtered = results.filter((item) => item.lat && item.lng);
    cache.set(cacheKey, filtered);
    return filtered;
  },
};

export const nominatimProvider: GeocodingProvider = {
  async search(query: string, options?: { viewbox?: [number, number, number, number] }) {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    const cacheKey = buildCacheKey(trimmed, options?.viewbox);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) ?? [];
    }
    const url = new URL('https://nominatim.openstreetmap.org/search');
    const parsed = parseStreetAndHouse(trimmed);
    if (parsed) {
      url.searchParams.set('street', `${parsed.houseNumber} ${parsed.street}`);
    } else {
      url.searchParams.set('q', trimmed);
    }
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '10');
    url.searchParams.set('countrycodes', 'kz');
    url.searchParams.set('accept-language', 'kk');
    if (options?.viewbox) {
      url.searchParams.set('viewbox', options.viewbox.join(','));
      url.searchParams.set('bounded', '1');
    }
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Qunarly/1.0' },
    });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as any[];
    const results = data
      .map((item) => {
        const typeValue = String(item.type ?? '');
        const kind = typeValue.includes('house') || typeValue.includes('building') ? 'house' :
          typeValue.includes('residential') || typeValue.includes('road') || typeValue.includes('street')
            ? 'street'
            : 'place';
        return {
        id: String(item.place_id),
        title: item.display_name?.split(',')[0] ?? trimmed,
        subtitle: buildSubtitle(item.address),
        lat: Number(item.lat),
        lng: Number(item.lon),
        type: typeValue,
        kind,
        };
      })
      .sort((a, b) => getTypeRank(a.type) - getTypeRank(b.type))
      .map(({ type, ...rest }) => rest);
    cache.set(cacheKey, results);
    return results;
  },
};

export const geocodingProvider = googlePlacesProvider;
