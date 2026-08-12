import { useEffect, useState } from 'react';
import { invoiceApi } from './api';
import './App.css';

const emptyItem = () => ({ description: '', quantity: 1, price: 0 });

const emptyForm = () => ({
  invoiceNumber: '',
  date: new Date().toISOString().slice(0, 10),
  dueDate: '',
  from: { name: '', address: '', email: '' },
  to: { name: '', address: '', email: '' },
  items: [emptyItem()],
  taxRate: 0,
  notes: '',
});

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceApi.list();
      setInvoices(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const updateParty = (party, field, value) => {
    setForm((prev) => ({ ...prev, [party]: { ...prev[party], [field]: value } }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => {
      const items = prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      return { ...prev, items };
    });
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const removeItem = (index) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const subtotal = form.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );
  const tax = subtotal * ((Number(form.taxRate) || 0) / 100);
  const total = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await invoiceApi.create(form);
      setForm(emptyForm());
      await loadInvoices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await invoiceApi.remove(id);
      await loadInvoices();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Invoice Generator</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="layout">
        <section className="panel">
          <h2>New Invoice</h2>
          <form onSubmit={handleSubmit} className="invoice-form">
            <div className="form-row">
              <label>
                Invoice #
                <input
                  required
                  value={form.invoiceNumber}
                  onChange={(e) => setForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </label>
              <label>
                Due Date
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </label>
            </div>

            <div className="form-row two-col">
              <fieldset>
                <legend>From</legend>
                <input
                  placeholder="Name"
                  value={form.from.name}
                  onChange={(e) => updateParty('from', 'name', e.target.value)}
                />
                <input
                  placeholder="Address"
                  value={form.from.address}
                  onChange={(e) => updateParty('from', 'address', e.target.value)}
                />
                <input
                  placeholder="Email"
                  value={form.from.email}
                  onChange={(e) => updateParty('from', 'email', e.target.value)}
                />
              </fieldset>
              <fieldset>
                <legend>To</legend>
                <input
                  placeholder="Name"
                  value={form.to.name}
                  onChange={(e) => updateParty('to', 'name', e.target.value)}
                />
                <input
                  placeholder="Address"
                  value={form.to.address}
                  onChange={(e) => updateParty('to', 'address', e.target.value)}
                />
                <input
                  placeholder="Email"
                  value={form.to.email}
                  onChange={(e) => updateParty('to', 'email', e.target.value)}
                />
              </fieldset>
            </div>

            <div className="items-section">
              <div className="items-header">
                <span>Description</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Amount</span>
                <span />
              </div>
              {form.items.map((item, index) => (
                <div className="item-row" key={index}>
                  <input
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                  />
                  <span className="amount">
                    {formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removeItem(index)}
                    disabled={form.items.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="secondary" onClick={addItem}>
                + Add item
              </button>
            </div>

            <div className="form-row">
              <label>
                Tax rate (%)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => setForm((p) => ({ ...p, taxRate: e.target.value }))}
                />
              </label>
            </div>

            <label className="notes-label">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </label>

            <div className="totals">
              <div>Subtotal: {formatCurrency(subtotal)}</div>
              <div>Tax: {formatCurrency(tax)}</div>
              <div className="grand-total">Total: {formatCurrency(total)}</div>
            </div>

            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Invoice'}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Invoices</h2>
          {loading ? (
            <p>Loading…</p>
          ) : invoices.length === 0 ? (
            <p className="empty">No invoices yet.</p>
          ) : (
            <ul className="invoice-list">
              {invoices.map((inv) => (
                <li key={inv.id} className="invoice-card">
                  <div>
                    <strong>#{inv.invoiceNumber}</strong>
                    <div className="muted">
                      {inv.to?.name || 'Unnamed client'} · {inv.date}
                    </div>
                  </div>
                  <div className="invoice-card-total">{formatCurrency(inv.totals?.total)}</div>
                  <div className="invoice-card-actions">
                    <a href={invoiceApi.pdfUrl(inv.id)} target="_blank" rel="noreferrer">
                      PDF
                    </a>
                    <button className="icon-btn" onClick={() => handleDelete(inv.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
