const sgMail = require('@sendgrid/mail');

const MAX_ATTEMPTS = 3;
const SEND_BUDGET_MS = 15000;
const RETRY_DELAY_MS = 500;

function isDryRun() {
  return process.env.SEND_DRY_RUN === 'true';
}

function getSenderIdentity() {
  return {
    email: process.env.SENDER_EMAIL || 'invoices@example.com',
    name: process.env.SENDER_NAME || 'Invoice Generator',
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function send({ to, subject, html, attachments }) {
  if (isDryRun()) {
    return { outcome: 'Sent', error: null };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
  const sender = getSenderIdentity();
  const message = {
    to,
    from: { email: sender.email, name: sender.name },
    subject,
    html,
    ...(attachments ? { attachments } : {}),
  };

  const deadline = Date.now() + SEND_BUDGET_MS;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (Date.now() >= deadline) break;
    try {
      await sgMail.send(message);
      return { outcome: 'Sent', error: null };
    } catch (err) {
      lastError = err.message || 'Email send failed';
      if (attempt < MAX_ATTEMPTS && Date.now() + RETRY_DELAY_MS < deadline) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  return { outcome: 'Failed', error: lastError || 'Email send failed' };
}

function invoiceEmailHtml(invoice, totals) {
  return `
    <p>Please find attached invoice #${invoice.invoiceNumber}.</p>
    <p>Total due: ${totals.total.toFixed(2)}</p>
    ${invoice.dueDate ? `<p>Due date: ${invoice.dueDate}</p>` : ''}
  `;
}

async function sendInvoiceEmail({ to, invoice, totals, pdfBuffer }) {
  return send({
    to,
    subject: `Invoice #${invoice.invoiceNumber}`,
    html: invoiceEmailHtml(invoice, totals),
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });
}

function passwordResetEmailHtml(token) {
  return `
    <p>You requested a password reset.</p>
    <p>Your reset token: <strong>${token}</strong></p>
    <p>This token expires in 1 hour and can only be used once.</p>
  `;
}

async function sendPasswordResetEmail({ to, token }) {
  return send({
    to,
    subject: 'Password reset request',
    html: passwordResetEmailHtml(token),
  });
}

module.exports = { send, sendInvoiceEmail, sendPasswordResetEmail };
