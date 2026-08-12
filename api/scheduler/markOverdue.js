const { readInvoices, writeInvoices, appendAudit } = require('../utils/store');

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const now = new Date();
  const diff = now - d;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function markOverdue(graceDays = 15) {
  const invoices = readInvoices();
  let changed = false;
  invoices.forEach((inv) => {
    const status = inv.paymentStatus || 'Unpaid';
    if (status === 'Unpaid' && inv.dueDate) {
      const days = daysBetween(inv.dueDate);
      if (days !== null && days > graceDays) {
        const prev = status;
        inv.paymentStatus = 'Overdue';
        inv.version = (inv.version || 1) + 1;
        const audit = {
          id: require('crypto').randomUUID(),
          invoiceId: inv.id,
          previousStatus: prev,
          newStatus: 'Overdue',
          adminUserId: 'system',
          reason: 'Automatic overdue after grace period',
          createdAt: new Date().toISOString(),
        };
        try {
          appendAudit(audit);
        } catch (e) {
          console.error('Failed to write audit entry for invoice', inv.id, e);
        }
        changed = true;
      }
    }
  });

  if (changed) writeInvoices(invoices);
  return changed;
}

if (require.main === module) {
  const changed = markOverdue(15);
  console.log('MarkOverdue completed. Changes made:', changed);
}

module.exports = { markOverdue };
