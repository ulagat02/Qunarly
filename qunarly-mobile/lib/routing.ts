export type RouteResult = {
  coordinates: { latitude: number; longitude: number }[];
  distanceKm: number;
  durationMin: number;
  fallback?: boolean;
  warning?: string;
};

export type RoutingProvider = {
  route: (start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) => Promise<RouteResult>;
};

const decodePolyline = (polyline: string) => {
  let index = 0;
  const len = polyline.length;
  let lat = 0;
  let lng = 0;
  const coordinates: { latitude: number; longitude: number }[] = [];
  while (index < len) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
};

const haversineKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const fallbackRoute = (start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) => {
  const distanceKm = haversineKm(start, end);
  return {
    coordinates: [start, end],
    distanceKm,
    durationMin: Math.round((distanceKm / 40) * 60),
    fallback: true,
    warning: 'Бұл аймақта жол дерегі толық емес болуы мүмкін.',
  };
};

export const osrmProvider: RoutingProvider = {
  async route(start, end) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline&steps=false`;
      const response = await fetch(url);
      if (!response.ok) {
        return fallbackRoute(start, end);
      }
      const data = await response.json();
      if (!data?.routes?.length) {
        return fallbackRoute(start, end);
      }
      const route = data.routes[0];
      const coordinates = decodePolyline(route.geometry);
      return {
        coordinates,
        distanceKm: route.distance / 1000,
        durationMin: Math.round(route.duration / 60),
      };
    } catch {
      return fallbackRoute(start, end);
    }
  },
};

export const routingProvider = osrmProvider;
