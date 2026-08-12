function computeTotals(invoice) {
  const items = invoice.items || [];
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + qty * price;
  }, 0);
  const taxRate = Number(invoice.taxRate) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

module.exports = { computeTotals };
