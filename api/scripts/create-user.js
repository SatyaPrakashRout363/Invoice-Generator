const readline = require('readline');
const crypto = require('crypto');
const { readUsers, writeUsers, findByUsername } = require('../utils/userStore');
const { hashPassword } = require('../utils/auth');

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const username = (await prompt(rl, 'Username: ')).trim();
  if (!username) {
    console.error('Username is required.');
    rl.close();
    process.exitCode = 1;
    return;
  }

  if (findByUsername(username)) {
    console.error(`A user named "${username}" already exists.`);
    rl.close();
    process.exitCode = 1;
    return;
  }

  const password = await prompt(rl, 'Password: ');
  rl.close();
  if (!password) {
    console.error('Password is required.');
    process.exitCode = 1;
    return;
  }

  const users = readUsers();
  users.push({
    id: crypto.randomUUID(),
    username,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });
  writeUsers(users);

  console.log(`User "${username}" created.`);
}

main();
