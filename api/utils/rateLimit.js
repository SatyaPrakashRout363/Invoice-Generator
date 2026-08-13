const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const SEND_MAX_PER_HOUR = 50;
const SEND_WINDOW_MS = 60 * 60 * 1000;

const loginAttempts = new Map();
const sendTimestamps = new Map();

function recordFailedLogin(username) {
  const entry = loginAttempts.get(username) || { failedCount: 0, lockedUntil: 0 };
  if (entry.lockedUntil && entry.lockedUntil < Date.now()) {
    entry.failedCount = 0;
    entry.lockedUntil = 0;
  }
  entry.failedCount += 1;
  if (entry.failedCount >= LOGIN_MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  }
  loginAttempts.set(username, entry);
  return entry;
}

function resetLoginAttempts(username) {
  loginAttempts.delete(username);
}

function getLockoutRemainingSeconds(username) {
  const entry = loginAttempts.get(username);
  if (!entry || !entry.lockedUntil) return 0;
  const remainingMs = entry.lockedUntil - Date.now();
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}

function isLockedOut(username) {
  return getLockoutRemainingSeconds(username) > 0;
}

function recordSend(userId) {
  const timestamps = sendTimestamps.get(userId) || [];
  timestamps.push(Date.now());
  sendTimestamps.set(userId, timestamps);
}

function isSendRateLimited(userId) {
  const cutoff = Date.now() - SEND_WINDOW_MS;
  const timestamps = (sendTimestamps.get(userId) || []).filter((ts) => ts > cutoff);
  sendTimestamps.set(userId, timestamps);
  return timestamps.length >= SEND_MAX_PER_HOUR;
}

module.exports = {
  recordFailedLogin,
  resetLoginAttempts,
  getLockoutRemainingSeconds,
  isLockedOut,
  recordSend,
  isSendRateLimited,
  LOGIN_MAX_ATTEMPTS,
  SEND_MAX_PER_HOUR,
};
