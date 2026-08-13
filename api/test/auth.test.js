const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  hashPassword,
  verifyPassword,
  generateResetToken,
  validateResetToken,
  consumeResetToken,
} = require('../utils/auth');

const TOKENS_FILE = path.join(__dirname, '..', 'data', 'resetTokens.json');

function snapshotTokensFile() {
  return fs.existsSync(TOKENS_FILE) ? fs.readFileSync(TOKENS_FILE, 'utf-8') : null;
}

function restoreTokensFile(snapshot) {
  if (snapshot === null) {
    if (fs.existsSync(TOKENS_FILE)) fs.unlinkSync(TOKENS_FILE);
  } else {
    fs.writeFileSync(TOKENS_FILE, snapshot);
  }
}

test('hashPassword/verifyPassword round trip', async () => {
  const hash = await hashPassword('correct-password');
  assert.equal(await verifyPassword('correct-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('reset token generate/validate/consume lifecycle', async (t) => {
  const snapshot = snapshotTokensFile();
  t.after(() => restoreTokensFile(snapshot));

  const token = generateResetToken('user-123');

  const first = validateResetToken(token);
  assert.equal(first.valid, true);
  assert.equal(first.record.userId, 'user-123');

  consumeResetToken(first.record, first.tokens);

  const second = validateResetToken(token);
  assert.equal(second.valid, false);
});

test('validateResetToken rejects unknown tokens', (t) => {
  const snapshot = snapshotTokensFile();
  t.after(() => restoreTokensFile(snapshot));

  const result = validateResetToken('this-token-was-never-issued');
  assert.equal(result.valid, false);
});
