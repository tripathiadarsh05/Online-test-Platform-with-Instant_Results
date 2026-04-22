const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { submitTest, listResults } = require('../controllers/resultController');

const router = express.Router();

router.get('/', protect, listResults);
router.post('/submit', protect, submitTest);

module.exports = router;
