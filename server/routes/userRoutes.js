const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { listUsers, addUser, removeUser } = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, adminOnly, listUsers);
router.post('/', protect, adminOnly, addUser);
router.delete('/:id', protect, adminOnly, removeUser);

module.exports = router;
