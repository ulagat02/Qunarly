import http from 'k6/http';

/**
 * POST /auth/login
 * @returns {string} accessToken
 */
export function login(baseUrl, email, password) {
  const res = http.post(
    `${baseUrl}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} body=${res.body}`);
  }
  const body = res.json();
  return body.accessToken;
}

/**
 * POST /auth/dev-login (NODE_ENV !== production only)
 */
export function devLogin(baseUrl) {
  const res = http.post(`${baseUrl}/auth/dev-login`, null, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Dev login failed: ${res.status}`);
  }
  return res.json('accessToken');
}
