const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { readTokens, writeTokens } = require('./resetTokenStore');

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokens = readTokens();
  tokens.push({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    used: false,
  });
  writeTokens(tokens);
  return token;
}

function validateResetToken(token) {
  const tokenHash = hashToken(token);
  const tokens = readTokens();
  const record = tokens.find((t) => t.tokenHash === tokenHash);
  if (!record) return { valid: false };
  if (record.used) return { valid: false };
  if (new Date(record.expiresAt).getTime() < Date.now()) return { valid: false };
  return { valid: true, record, tokens };
}

function consumeResetToken(record, tokens) {
  record.used = true;
  writeTokens(tokens);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateResetToken,
  validateResetToken,
  consumeResetToken,
};
