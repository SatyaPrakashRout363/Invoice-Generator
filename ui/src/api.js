const BASE_URL = '/api/invoices';
const AUTH_URL = '/api/auth';

class AuthError extends Error {}

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new AuthError(body.error || 'Not authenticated');
    }
    const err = new Error(body.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const invoiceApi = {
  list: () => fetch(BASE_URL, { credentials: 'include' }).then(handle),
  get: (id) => fetch(`${BASE_URL}/${id}`, { credentials: 'include' }).then(handle),
  create: (invoice) =>
    fetch(BASE_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    }).then(handle),
  update: (id, invoice) =>
    fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    }).then(handle),
  remove: (id, options = {}) =>
    fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    }).then(handle),
  send: (id) =>
    fetch(`${BASE_URL}/${id}/send`, { method: 'POST', credentials: 'include' }).then(handle),
  pdfUrl: (id) => `${BASE_URL}/${id}/pdf`,
};

export const authApi = {
  login: (username, password) =>
    fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(handle),
  logout: () =>
    fetch(`${AUTH_URL}/logout`, { method: 'POST', credentials: 'include' }).then(handle),
  forgotPassword: (username) =>
    fetch(`${AUTH_URL}/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    }).then(handle),
  resetPassword: (token, newPassword) =>
    fetch(`${AUTH_URL}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    }).then(handle),
};

export { AuthError };
