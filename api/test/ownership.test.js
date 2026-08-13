const test = require('node:test');
const assert = require('node:assert/strict');

const { filterOwned, findOwned } = require('../middleware/ownership');

const invoices = [
  { id: '1', ownerId: 'user-a' },
  { id: '2', ownerId: 'user-b' },
  { id: '3', ownerId: 'user-a' },
];

test('filterOwned returns only invoices belonging to the given user', () => {
  const result = filterOwned(invoices, 'user-a');
  assert.deepEqual(result.map((inv) => inv.id), ['1', '3']);
});

test('findOwned returns the invoice when it belongs to the user', () => {
  const result = findOwned(invoices, '2', 'user-b');
  assert.equal(result.id, '2');
});

test('findOwned returns null for another user\'s invoice', () => {
  const result = findOwned(invoices, '2', 'user-a');
  assert.equal(result, null);
});

test('findOwned returns null for an unknown invoice id', () => {
  const result = findOwned(invoices, 'does-not-exist', 'user-a');
  assert.equal(result, null);
});
