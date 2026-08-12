const BASE_URL = '/api/invoices';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const invoiceApi = {
  list: () => fetch(BASE_URL).then(handle),
  get: (id) => fetch(`${BASE_URL}/${id}`).then(handle),
  create: (invoice) =>
    fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    }).then(handle),
  remove: (id) => fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then(handle),
  pdfUrl: (id) => `${BASE_URL}/${id}/pdf`,
};
