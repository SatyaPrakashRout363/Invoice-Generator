const path = require('path');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const SESSION_DIR = path.join(__dirname, '..', 'sessions');
const maxAgeDays = Number(process.env.SESSION_MAX_AGE_DAYS) || 30;

module.exports = session({
  store: new FileStore({ path: SESSION_DIR, retries: 0, logFn: () => {} }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
  },
});
