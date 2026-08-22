/**
 * GlobeTrotter — API Client
 *
 * A thin fetch wrapper that:
 *  1. Prepends the API base URL
 *  2. Attaches the JWT Authorization header (when present)
 *  3. Parses JSON
 *  4. Throws on non-2xx or { success: false } responses
 *
 * Usage:
 *   import api from '@/api/client';
 *   const { data } = await api.get('/trips');
 *   const { data } = await api.post('/trips', { title: 'Paris 2025' });
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('gt_token');
}

async function request(endpoint, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config);

  /* Handle non-JSON responses (e.g. 204 No Content) */
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return { success: true, data: null };
  }

  const json = await res.json();

  /* The Django API returns { success, data } or { success, error } */
  if (!res.ok || json.success === false) {
    const message = json.error || json.detail || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.response = json;
    throw err;
  }

  return json;
}

const api = {
  get:    (endpoint, opts) => request(endpoint, { ...opts, method: 'GET' }),
  post:   (endpoint, body, opts) => request(endpoint, { ...opts, method: 'POST', body }),
  put:    (endpoint, body, opts) => request(endpoint, { ...opts, method: 'PUT', body }),
  patch:  (endpoint, body, opts) => request(endpoint, { ...opts, method: 'PATCH', body }),
  delete: (endpoint, opts) => request(endpoint, { ...opts, method: 'DELETE' }),
};

export default api;
