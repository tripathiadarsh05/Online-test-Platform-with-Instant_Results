const { findUsers, createUser, deleteUser } = require('../models/userModel');

async function listUsers(req, res, next) {
  try {
    res.json({ users: await findUsers() });
  } catch (error) {
    next(error);
  }
}

async function addUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !['admin', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Valid name, email, password and role are required' });
    }

    const user = await createUser({ name, email, password, role });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

async function removeUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  addUser,
  removeUser
};
