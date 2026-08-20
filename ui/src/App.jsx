import { useEffect, useState } from 'react';
import { invoiceApi, authApi, AuthError } from './api';
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

async function withConfirmation(action) {
  try {
    return await action(false);
  } catch (err) {
    if (err.status === 409 && err.body?.error === 'confirmation_required') {
      const proceed = window.confirm(
        `This invoice has already been ${err.body.deliveryStatus.toLowerCase()}. Continue anyway?`
      );
      if (!proceed) return null;
      return action(true);
    }
    throw err;
  }
}

function LoginScreen({ onLoggedIn }) {
  const [view, setView] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotUsername, setForgotUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const user = await authApi.login(username, password);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await authApi.forgotPassword(forgotUsername);
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await authApi.resetPassword(resetToken, resetPassword);
      setMessage(res.message);
      setResetToken('');
      setResetPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const switchView = (next) => {
    setView(next);
    setError('');
    setMessage('');
  };

  return (
    <div className="app auth-app">
      <header>
        <h1>Invoice Generator</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {message && <div className="info-banner">{message}</div>}

      {view === 'login' && (
        <form onSubmit={handleLogin} className="auth-form panel">
          <h2>Log in</h2>
          <label>
            Username
            <input required value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
          <button type="button" className="link-btn" onClick={() => switchView('forgot')}>
            Forgot password?
          </button>
        </form>
      )}

      {view === 'forgot' && (
        <form onSubmit={handleForgot} className="auth-form panel">
          <h2>Forgot password</h2>
          <label>
            Username
            <input
              required
              value={forgotUsername}
              onChange={(e) => setForgotUsername(e.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset email'}
          </button>
          <button type="button" className="link-btn" onClick={() => switchView('reset')}>
            Have a reset token?
          </button>
          <button type="button" className="link-btn" onClick={() => switchView('login')}>
            Back to login
          </button>
        </form>
      )}

      {view === 'reset' && (
        <form onSubmit={handleReset} className="auth-form panel">
          <h2>Reset password</h2>
          <label>
            Reset token
            <input required value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
          </label>
          <label>
            New password
            <input
              required
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>
          <button type="button" className="link-btn" onClick={() => switchView('login')}>
            Back to login
          </button>
        </form>
      )}
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [currentUser, setCurrentUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceApi.list();
      setInvoices(data);
      setAuthState('authenticated');
      setError('');
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthState('login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  if (authState === 'loading' && loading) {
    return (
      <div className="app">
        <p>Loading…</p>
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <LoginScreen
        onLoggedIn={(user) => {
          setCurrentUser(user);
          loadInvoices();
        }}
      />
    );
  }

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

  const handleEdit = (inv) => {
    setEditingId(inv.id);
    setForm({
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      dueDate: inv.dueDate || '',
      from: inv.from || { name: '', address: '', email: '' },
      to: inv.to || { name: '', address: '', email: '' },
      items: inv.items?.length ? inv.items : [emptyItem()],
      taxRate: inv.taxRate || 0,
      notes: inv.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const result = await withConfirmation((confirm) =>
          invoiceApi.update(editingId, { ...form, confirm })
        );
        if (result === null) return;
        setEditingId(null);
      } else {
        await invoiceApi.create(form);
      }
      setForm(emptyForm());
      await loadInvoices();
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthState('login');
        return;
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (inv) => {
    try {
      const result = await withConfirmation((confirm) => invoiceApi.remove(inv.id, { confirm }));
      if (result === null) return;
      if (editingId === inv.id) handleCancelEdit();
      await loadInvoices();
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthState('login');
        return;
      }
      setError(err.message);
    }
  };

  const handleSend = async (inv) => {
    setSendingId(inv.id);
    setError('');
    try {
      await invoiceApi.send(inv.id);
      await loadInvoices();
    } catch (err) {
      if (err instanceof AuthError) {
        setAuthState('login');
        return;
      }
      setError(err.message);
    } finally {
      setSendingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors, fall through to reset local state anyway
    }
    setCurrentUser(null);
    setInvoices([]);
    setForm(emptyForm());
    setEditingId(null);
    setAuthState('login');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Invoice Generator</h1>
        <div className="header-actions">
          {currentUser && <span className="muted">{currentUser.username}</span>}
          <button type="button" className="secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="layout">
        <section className="panel">
          <h2>{editingId ? 'Edit Invoice' : 'New Invoice'}</h2>
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

            <div className="form-actions">
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Save Invoice'}
              </button>
              {editingId && (
                <button type="button" className="secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
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
                    <div className={`delivery-status status-${inv.deliveryStatus?.replace(/\s+/g, '-').toLowerCase()}`}>
                      {inv.deliveryStatus || 'Not Sent'}
                      {inv.lastSentAt && ` · last sent ${new Date(inv.lastSentAt).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="invoice-card-total">{formatCurrency(inv.totals?.total)}</div>
                  <div className="invoice-card-actions">
                    <a href={invoiceApi.pdfUrl(inv.id)} target="_blank" rel="noreferrer">
                      PDF
                    </a>
                    <button
                      className="icon-btn"
                      onClick={() => handleSend(inv)}
                      disabled={sendingId === inv.id}
                    >
                      {sendingId === inv.id
                        ? 'Sending…'
                        : inv.deliveryStatus === 'Sent'
                        ? 'Resend'
                        : 'Send'}
                    </button>
                    <button className="icon-btn" onClick={() => handleEdit(inv)}>
                      Edit
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(inv)}>
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
