import http from 'k6/http';

function safeJson(res) {
  if (!res.body || res.body.trim() === '') return null;
  try {
    return res.json();
  } catch {
    return null;
  }
}

export function listOpenTrips(baseUrl, token, routeId) {
  const res = http.get(`${baseUrl}/trips/open?routeId=${routeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: safeJson(res) };
}

export function openTrip(baseUrl, token, routeId, totalSeats = 4) {
  const res = http.post(
    `${baseUrl}/trips/open`,
    JSON.stringify({ routeId, totalSeats }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return { status: res.status, data: safeJson(res) };
}

export function joinTrip(baseUrl, token, tripId, seatCount = 1) {
  const res = http.post(
    `${baseUrl}/trips/${tripId}/join`,
    JSON.stringify({ seatCount }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return { status: res.status, data: safeJson(res) };
}

export function leaveTrip(baseUrl, token, tripId) {
  const res = http.post(
    `${baseUrl}/trips/${tripId}/leave`,
    null,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return { status: res.status };
}

export function closeIntent(baseUrl, token, tripId) {
  const res = http.post(
    `${baseUrl}/trips/${tripId}/closeIntent`,
    null,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return { status: res.status, data: safeJson(res) };
}

export function startTrip(baseUrl, token, tripId) {
  const res = http.post(
    `${baseUrl}/trips/${tripId}/start`,
    null,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return { status: res.status };
}

export function cancelTrip(baseUrl, token, tripId) {
  const res = http.post(
    `${baseUrl}/trips/${tripId}/cancel`,
    null,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return { status: res.status, data: safeJson(res) };
}

export function getTrip(baseUrl, token, tripId) {
  const res = http.get(`${baseUrl}/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: safeJson(res) };
}

export function getMeActive(baseUrl, token) {
  const res = http.get(`${baseUrl}/me/active`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, data: safeJson(res) };
}
