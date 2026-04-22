const jwt = require('jsonwebtoken');
const { findUserById, publicUser } = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.user = publicUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

module.exports = {
  protect,
  adminOnly,
  JWT_SECRET
};
