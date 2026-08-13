const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json');

function readUsers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function findByUsername(username) {
  return readUsers().find((u) => u.username === username);
}

module.exports = { readUsers, writeUsers, findByUsername };
