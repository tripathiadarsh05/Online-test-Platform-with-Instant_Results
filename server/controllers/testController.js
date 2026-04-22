const { findTests, findTestById, createTest, updateTest, deleteTest } = require('../models/testModel');

function validateTestPayload(req, res, next) {
  const { title, duration, questions } = req.body;

  if (!title || !duration || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Title, duration and questions are required' });
  }

  for (const question of questions) {
    if (!question.text || !Array.isArray(question.options) || question.options.length < 2) {
      return res.status(400).json({ message: 'Each question needs text and at least two options' });
    }

    const answer = Number(question.correctAnswer);
    if (Number.isNaN(answer) || answer < 0 || answer >= question.options.length) {
      return res.status(400).json({ message: 'Correct answer must match one of the options' });
    }
  }

  next();
}

async function listTests(req, res, next) {
  try {
    const tests = await findTests({ includeAnswers: req.user.role === 'admin' });
    res.json({ tests });
  } catch (error) {
    next(error);
  }
}

async function getTest(req, res, next) {
  try {
    const test = await findTestById(req.params.id, { includeAnswers: req.user.role === 'admin' });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({ test });
  } catch (error) {
    next(error);
  }
}

async function addTest(req, res, next) {
  try {
    const test = await createTest(req.body);
    res.status(201).json({ test });
  } catch (error) {
    next(error);
  }
}

async function editTest(req, res, next) {
  try {
    const test = await updateTest(req.params.id, req.body);
    res.json({ test });
  } catch (error) {
    next(error);
  }
}

async function removeTest(req, res, next) {
  try {
    await deleteTest(req.params.id);
    res.json({ message: 'Test deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validateTestPayload,
  listTests,
  getTest,
  addTest,
  editTest,
  removeTest
};
