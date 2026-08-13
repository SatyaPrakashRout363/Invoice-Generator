const express = require('express');
const crypto = require('crypto');
const { readInvoices, writeInvoices } = require('../utils/store');
const { computeTotals } = require('../utils/totals');
const { buildInvoicePdf } = require('../utils/pdf');
const requireSession = require('../middleware/requireSession');
const { loadOwnedInvoice, filterOwned } = require('../middleware/ownership');
const { isSendRateLimited, recordSend } = require('../utils/rateLimit');
const { sendInvoiceEmail } = require('../utils/email');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(requireSession);

function collectPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

router.get('/', (req, res) => {
  const invoices = filterOwned(readInvoices(), req.session.userId);
  res.json(invoices.map((inv) => ({ ...inv, totals: computeTotals(inv) })));
});

router.get('/:id', loadOwnedInvoice, (req, res) => {
  res.json({ ...req.invoice, totals: computeTotals(req.invoice) });
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.invoiceNumber || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'invoiceNumber and at least one item are required' });
  }

  const invoice = {
    id: crypto.randomUUID(),
    ownerId: req.session.userId,
    invoiceNumber: body.invoiceNumber,
    date: body.date || new Date().toISOString().slice(0, 10),
    dueDate: body.dueDate || '',
    from: body.from || {},
    to: body.to || {},
    items: body.items,
    taxRate: Number(body.taxRate) || 0,
    notes: body.notes || '',
    deliveryStatus: 'Not Sent',
    lastSentAt: null,
    sendCount: 0,
    sendHistory: [],
  };

  const invoices = readInvoices();
  invoices.push(invoice);
  writeInvoices(invoices);
  res.status(201).json({ ...invoice, totals: computeTotals(invoice) });
});

router.put('/:id', loadOwnedInvoice, (req, res) => {
  const { invoice, invoices } = req;
  if (invoice.deliveryStatus !== 'Not Sent' && req.body?.confirm !== true) {
    return res.status(409).json({ error: 'confirmation_required', deliveryStatus: invoice.deliveryStatus });
  }

  const index = invoices.findIndex((inv) => inv.id === invoice.id);
  const updated = { ...invoice, ...req.body, id: invoice.id, ownerId: invoice.ownerId };
  delete updated.confirm;
  invoices[index] = updated;
  writeInvoices(invoices);
  res.json({ ...updated, totals: computeTotals(updated) });
});

router.delete('/:id', loadOwnedInvoice, (req, res) => {
  const { invoice, invoices } = req;
  if (invoice.deliveryStatus !== 'Not Sent' && req.body?.confirm !== true) {
    return res.status(409).json({ error: 'confirmation_required', deliveryStatus: invoice.deliveryStatus });
  }

  const index = invoices.findIndex((inv) => inv.id === invoice.id);
  invoices.splice(index, 1);
  writeInvoices(invoices);
  res.status(204).end();
});

router.get('/:id/pdf', loadOwnedInvoice, (req, res) => {
  const { invoice } = req;
  const totals = computeTotals(invoice);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

  const doc = buildInvoicePdf(invoice, totals);
  doc.pipe(res);
  doc.end();
});

router.post('/:id/send', loadOwnedInvoice, async (req, res) => {
  const { invoice, invoices } = req;
  const userId = req.session.userId;

  if (isSendRateLimited(userId)) {
    return res.status(429).json({ error: 'Send rate limit exceeded, try again later' });
  }

  const recipient = invoice.to?.email;
  if (!recipient || !EMAIL_REGEX.test(recipient)) {
    return res.status(400).json({ error: 'Invoice recipient email is missing or invalid' });
  }

  const totals = computeTotals(invoice);
  const doc = buildInvoicePdf(invoice, totals);
  const pdfBufferPromise = collectPdfBuffer(doc);
  doc.end();
  const pdfBuffer = await pdfBufferPromise;

  const result = await sendInvoiceEmail({ to: recipient, invoice, totals, pdfBuffer });
  recordSend(userId);

  const index = invoices.findIndex((inv) => inv.id === invoice.id);
  const updated = {
    ...invoice,
    deliveryStatus: result.outcome,
    lastSentAt: new Date().toISOString(),
    sendCount: invoice.sendCount + 1,
    sendHistory: [
      ...invoice.sendHistory,
      {
        timestamp: new Date().toISOString(),
        outcome: result.outcome,
        error: result.error,
        triggeredBy: userId,
      },
    ],
  };
  invoices[index] = updated;
  writeInvoices(invoices);

  res.json({ ...updated, totals: computeTotals(updated) });
});

module.exports = router;
