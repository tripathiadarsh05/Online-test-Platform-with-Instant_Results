const { findTestById } = require('../models/testModel');
const { createResult, findResults } = require('../models/resultModel');

async function submitTest(req, res, next) {
  try {
    const { testId, answers = [], tabSwitches = 0, autoSubmitted = false } = req.body;
    const test = await findTestById(testId, { includeAnswers: true });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    let score = 0;
    const details = test.questions.map((question, index) => {
      const selectedAnswer = answers[index] === null || answers[index] === undefined ? null : Number(answers[index]);
      const isCorrect = selectedAnswer === question.correctAnswer;

      if (isCorrect) score += 1;

      return {
        questionId: question.id,
        questionText: question.text,
        options: question.options,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const result = await createResult({
      userId: req.user.id,
      testId: test.id,
      testTitle: test.title,
      score,
      total: test.questions.length,
      percentage: Math.round((score / test.questions.length) * 100),
      answers: details,
      tabSwitches: Number(tabSwitches) || 0,
      autoSubmitted: Boolean(autoSubmitted)
    });

    res.status(201).json({ result });
  } catch (error) {
    next(error);
  }
}

async function listResults(req, res, next) {
  try {
    const results = await findResults({ userId: req.user.id, role: req.user.role });
    res.json({ results });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitTest,
  listResults
};
