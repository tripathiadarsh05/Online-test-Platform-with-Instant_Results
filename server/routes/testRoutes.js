const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  validateTestPayload,
  listTests,
  getTest,
  addTest,
  editTest,
  removeTest
} = require('../controllers/testController');

const router = express.Router();

router.get('/', protect, listTests);
router.get('/:id', protect, getTest);
router.post('/', protect, adminOnly, validateTestPayload, addTest);
router.put('/:id', protect, adminOnly, validateTestPayload, editTest);
router.delete('/:id', protect, adminOnly, removeTest);

module.exports = router;
