const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('./db');

function sanitizeTestForStudent(test) {
  return {
    ...test,
    questions: test.questions.map(({ correctAnswer, ...question }) => question)
  };
}

async function findTests({ includeAnswers = false } = {}) {
  const db = await readDb();
  return includeAnswers ? db.tests : db.tests.map(sanitizeTestForStudent);
}

async function findTestById(id, { includeAnswers = false } = {}) {
  const db = await readDb();
  const test = db.tests.find((item) => item.id === id);
  if (!test) return null;
  return includeAnswers ? test : sanitizeTestForStudent(test);
}

async function createTest({ title, duration, questions }) {
  const db = await readDb();
  const test = {
    id: uuid(),
    title,
    duration: Number(duration),
    createdAt: new Date().toISOString(),
    questions: questions.map((question) => ({
      id: uuid(),
      text: question.text,
      options: question.options,
      correctAnswer: Number(question.correctAnswer)
    }))
  };

  db.tests.push(test);
  await writeDb(db);
  return test;
}

async function updateTest(id, payload) {
  const db = await readDb();
  const index = db.tests.findIndex((test) => test.id === id);

  if (index === -1) {
    const error = new Error('Test not found');
    error.statusCode = 404;
    throw error;
  }

  db.tests[index] = {
    ...db.tests[index],
    title: payload.title,
    duration: Number(payload.duration),
    questions: payload.questions.map((question) => ({
      id: question.id || uuid(),
      text: question.text,
      options: question.options,
      correctAnswer: Number(question.correctAnswer)
    }))
  };

  await writeDb(db);
  return db.tests[index];
}

async function deleteTest(id) {
  const db = await readDb();
  const before = db.tests.length;
  db.tests = db.tests.filter((test) => test.id !== id);
  db.results = db.results.filter((result) => result.testId !== id);

  if (before === db.tests.length) {
    const error = new Error('Test not found');
    error.statusCode = 404;
    throw error;
  }

  await writeDb(db);
}

module.exports = {
  findTests,
  findTestById,
  createTest,
  updateTest,
  deleteTest,
  sanitizeTestForStudent
};
