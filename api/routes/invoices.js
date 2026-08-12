const express = require('express');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { readInvoices, writeInvoices, appendAudit } = require('../utils/store');
const { computeTotals } = require('../utils/totals');

const router = express.Router();

// NOTE: Placeholder admin check. Integrate real auth/role checks per implementation plan.
function requireAdmin(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role && role.toLowerCase() === 'admin') return next();
  return res.status(403).json({ error: 'Admin role required' });
}

router.get('/', (req, res) => {
  const invoices = readInvoices();
  res.json(invoices.map((inv) => ({ ...inv, totals: computeTotals(inv) })));
});

router.get('/:id', (req, res) => {
  const invoices = readInvoices();
  const invoice = invoices.find((inv) => inv.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ ...invoice, totals: computeTotals(invoice) });
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.invoiceNumber || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'invoiceNumber and at least one item are required' });
  }

  const invoice = {
    id: crypto.randomUUID(),
    invoiceNumber: body.invoiceNumber,
    date: body.date || new Date().toISOString().slice(0, 10),
    dueDate: body.dueDate || '',
    from: body.from || {},
    to: body.to || {},
    items: body.items,
    taxRate: Number(body.taxRate) || 0,
    notes: body.notes || '',
    // New fields for payment-status enhancement
    paymentStatus: 'Unpaid',
    partial: Boolean(body.partial || false),
    version: 1,
  };

  const invoices = readInvoices();
  invoices.push(invoice);
  writeInvoices(invoices);
  res.status(201).json({ ...invoice, totals: computeTotals(invoice) });
});

router.put('/:id', (req, res) => {
  const invoices = readInvoices();
  const index = invoices.findIndex((inv) => inv.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found' });

  // Preserve paymentStatus/version unless explicitly provided via status endpoint
  const incoming = { ...req.body };
  delete incoming.paymentStatus;
  delete incoming.version;

  const updated = { ...invoices[index], ...incoming, id: invoices[index].id };
  invoices[index] = updated;
  writeInvoices(invoices);
  res.json({ ...updated, totals: computeTotals(updated) });
});

router.delete('/:id', (req, res) => {
  const invoices = readInvoices();
  const index = invoices.findIndex((inv) => inv.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found' });

  invoices.splice(index, 1);
  writeInvoices(invoices);
  res.status(204).end();
});

router.get('/:id/pdf', (req, res) => {
  const invoices = readInvoices();
  const invoice = invoices.find((inv) => inv.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const { subtotal, tax, total } = computeTotals(invoice);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text('INVOICE', { align: 'right' });
  doc.fontSize(10).text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' });
  doc.text(`Date: ${invoice.date}`, { align: 'right' });
  if (invoice.dueDate) doc.text(`Due: ${invoice.dueDate}`, { align: 'right' });
  doc.moveDown();

  doc.fontSize(12).text('From:', { continued: false });
  doc.fontSize(10).text(invoice.from?.name || '');
  doc.text(invoice.from?.address || '');
  doc.text(invoice.from?.email || '');
  doc.moveDown();

  doc.fontSize(12).text('To:');
  doc.fontSize(10).text(invoice.to?.name || '');
  doc.text(invoice.to?.address || '');
  doc.text(invoice.to?.email || '');
  doc.moveDown();

  const tableTop = doc.y + 10;
  doc.fontSize(10).text('Description', 50, tableTop);
  doc.text('Qty', 300, tableTop);
  doc.text('Price', 370, tableTop);
  doc.text('Amount', 450, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let y = tableTop + 25;
  invoice.items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const amount = qty * price;
    doc.text(item.description || '', 50, y, { width: 240 });
    doc.text(String(qty), 300, y);
    doc.text(price.toFixed(2), 370, y);
    doc.text(amount.toFixed(2), 450, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();
  y += 15;
  doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 370, y);
  y += 15;
  doc.text(`Tax (${invoice.taxRate || 0}%): ${tax.toFixed(2)}`, 370, y);
  y += 15;
  doc.fontSize(12).text(`Total: ${total.toFixed(2)}`, 370, y);

  if (invoice.notes) {
    doc.moveDown(2);
    doc.fontSize(10).text('Notes:', 50);
    doc.text(invoice.notes, 50);
  }

  // Payment status display
  doc.moveDown(2);
  doc.fontSize(10).text(`Payment Status: ${invoice.paymentStatus || 'Unpaid'}`, 50);
  if (invoice.partial) doc.text('Partial: Yes', 50);

  doc.end();
});

// Admin-only endpoint to change payment status with audit entry
router.patch('/:id/status', requireAdmin, (req, res) => {
  const invoices = readInvoices();
  const index = invoices.findIndex((inv) => inv.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found' });

  const invoice = invoices[index];
  const prevStatus = invoice.paymentStatus || 'Unpaid';
  const newStatus = req.body && req.body.paymentStatus;
  const reason = req.body && req.body.reason;

  if (!newStatus) return res.status(400).json({ error: 'paymentStatus is required' });

  // Update status and version
  invoice.paymentStatus = newStatus;
  invoice.version = (invoice.version || 1) + 1;
  invoices[index] = invoice;
  writeInvoices(invoices);

  // Append audit entry
  const audit = {
    id: crypto.randomUUID(),
    invoiceId: invoice.id,
    previousStatus: prevStatus,
    newStatus: newStatus,
    adminUserId: req.headers['x-user-id'] || 'unknown',
    reason: reason || null,
    createdAt: new Date().toISOString(),
  };
  try {
    appendAudit(audit);
  } catch (e) {
    // Log and continue
    console.error('Failed to write audit entry', e);
  }

  res.json({ ...invoice, totals: computeTotals(invoice) });
});

module.exports = router;
