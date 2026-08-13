const PDFDocument = require('pdfkit');

function buildInvoicePdf(invoice, totals) {
  const { subtotal, tax, total } = totals;
  const doc = new PDFDocument({ margin: 50 });

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

  return doc;
}

module.exports = { buildInvoicePdf };
