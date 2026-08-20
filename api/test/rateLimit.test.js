const test = require('node:test');
const assert = require('node:assert/strict');

const {
  recordFailedLogin,
  resetLoginAttempts,
  getLockoutRemainingSeconds,
  isLockedOut,
  recordSend,
  isSendRateLimited,
  LOGIN_MAX_ATTEMPTS,
  SEND_MAX_PER_HOUR,
} = require('../utils/rateLimit');

test('login lockout triggers after LOGIN_MAX_ATTEMPTS failures', () => {
  const username = 'lockout-test-user';

  for (let i = 0; i < LOGIN_MAX_ATTEMPTS - 1; i += 1) {
    recordFailedLogin(username);
  }
  assert.equal(isLockedOut(username), false);

  recordFailedLogin(username);
  assert.equal(isLockedOut(username), true);

  const remaining = getLockoutRemainingSeconds(username);
  assert.ok(remaining > 0 && remaining <= 15 * 60);

  resetLoginAttempts(username);
  assert.equal(isLockedOut(username), false);
  assert.equal(getLockoutRemainingSeconds(username), 0);
});

test('send rate limit triggers at SEND_MAX_PER_HOUR sends', () => {
  const userId = 'rate-limit-test-user';

  for (let i = 0; i < SEND_MAX_PER_HOUR - 1; i += 1) {
    recordSend(userId);
  }
  assert.equal(isSendRateLimited(userId), false);

  recordSend(userId);
  assert.equal(isSendRateLimited(userId), true);
});
