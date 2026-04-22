const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('./db');

async function createResult(result) {
  const db = await readDb();
  const record = {
    id: uuid(),
    ...result,
    submittedAt: new Date().toISOString()
  };

  db.results.push(record);
  await writeDb(db);
  return record;
}

async function findResults({ userId, role }) {
  const db = await readDb();

  if (role === 'admin') {
    return db.results.map((result) => ({
      ...result,
      user: db.users.find((user) => user.id === result.userId) || null,
      test: db.tests.find((test) => test.id === result.testId) || null
    }));
  }

  return db.results.filter((result) => result.userId === userId);
}

module.exports = {
  createResult,
  findResults
};
