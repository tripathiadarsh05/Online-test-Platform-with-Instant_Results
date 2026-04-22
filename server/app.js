const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const userRoutes = require('./routes/userRoutes');
const resultRoutes = require('./routes/resultRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { ensureDatabase } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 5000;

ensureDatabase();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/users', userRoutes);
app.use('/api/results', resultRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Online Test Platform running at http://localhost:${PORT}`);
  });
}

module.exports = app;
