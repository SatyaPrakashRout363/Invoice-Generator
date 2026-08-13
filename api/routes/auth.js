const express = require('express');
const { findByUsername, writeUsers, readUsers } = require('../utils/userStore');
const {
  verifyPassword,
  hashPassword,
  generateResetToken,
  validateResetToken,
  consumeResetToken,
} = require('../utils/auth');
const {
  recordFailedLogin,
  resetLoginAttempts,
  getLockoutRemainingSeconds,
  isLockedOut,
} = require('../utils/rateLimit');
const requireSession = require('../middleware/requireSession');
const emailService = require('../utils/email');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  if (isLockedOut(username)) {
    return res.status(403).json({
      error: 'Account locked due to too many failed attempts',
      remainingSeconds: getLockoutRemainingSeconds(username),
    });
  }

  const user = findByUsername(username);
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!valid) {
    recordFailedLogin(username);
    if (isLockedOut(username)) {
      return res.status(403).json({
        error: 'Account locked due to too many failed attempts',
        remainingSeconds: getLockoutRemainingSeconds(username),
      });
    }
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  resetLoginAttempts(username);
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username });
  });
});

router.post('/logout', requireSession, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

router.post('/forgot-password', async (req, res) => {
  const { username } = req.body || {};
  const user = username ? findByUsername(username) : null;

  if (user) {
    const token = generateResetToken(user.id);
    await emailService.sendPasswordResetEmail({ to: user.username, token });
  }

  res.json({ message: 'If that account exists, a reset email has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required' });
  }

  const result = validateResetToken(token);
  if (!result.valid) {
    return res.status(400).json({ error: 'Reset token is invalid or expired' });
  }

  const users = readUsers();
  const user = users.find((u) => u.id === result.record.userId);
  if (!user) {
    return res.status(400).json({ error: 'Reset token is invalid or expired' });
  }

  user.passwordHash = await hashPassword(newPassword);
  writeUsers(users);
  consumeResetToken(result.record, result.tokens);

  res.json({ message: 'Password has been reset' });
});

module.exports = router;
