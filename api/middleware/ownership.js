const { readInvoices } = require('../utils/store');

function filterOwned(invoices, userId) {
  return invoices.filter((inv) => inv.ownerId === userId);
}

function findOwned(invoices, id, userId) {
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice || invoice.ownerId !== userId) return null;
  return invoice;
}

function loadOwnedInvoice(req, res, next) {
  const invoices = readInvoices();
  const invoice = findOwned(invoices, req.params.id, req.session.userId);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  req.invoice = invoice;
  req.invoices = invoices;
  next();
}

module.exports = { loadOwnedInvoice, filterOwned, findOwned };
