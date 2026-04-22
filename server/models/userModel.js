const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('./db');

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

async function findUsers() {
  const db = await readDb();
  return db.users.map(publicUser);
}

async function findUserByEmail(email) {
  const db = await readDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

async function findUserById(id) {
  const db = await readDb();
  return db.users.find((user) => user.id === id);
}

async function createUser({ name, email, password, role = 'student' }) {
  const db = await readDb();
  const exists = db.users.some((user) => user.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  const user = {
    id: uuid(),
    name,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 10),
    role,
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  await writeDb(db);
  return publicUser(user);
}

async function deleteUser(id) {
  const db = await readDb();
  const before = db.users.length;
  db.users = db.users.filter((user) => user.id !== id);
  db.results = db.results.filter((result) => result.userId !== id);

  if (before === db.users.length) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  await writeDb(db);
}

module.exports = {
  publicUser,
  findUsers,
  findUserByEmail,
  findUserById,
  createUser,
  deleteUser
};
