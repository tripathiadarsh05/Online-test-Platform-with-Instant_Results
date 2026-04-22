const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, publicUser } = require('../models/userModel');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const user = await createUser({ name, email, password, role: 'student' });
    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  me
};
