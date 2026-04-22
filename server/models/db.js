const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const dataDir = process.env.VERCEL ? path.join('/tmp', 'online-test-platform-data') : path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');

const now = () => new Date().toISOString();

function createSeedData() {
  return {
    users: [
      {
        id: uuid(),
        name: 'Admin User',
        email: 'admin@test.com',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        createdAt: now()
      },
      {
        id: uuid(),
        name: 'Student User',
        email: 'student@test.com',
        password: bcrypt.hashSync('student123', 10),
        role: 'student',
        createdAt: now()
      }
    ],
    tests: [
      {
        id: uuid(),
        title: 'JavaScript Fundamentals',
        duration: 5,
        createdAt: now(),
        questions: [
          {
            id: uuid(),
            text: 'Which keyword declares a block-scoped variable?',
            options: ['var', 'let', 'function', 'return'],
            correctAnswer: 1
          },
          {
            id: uuid(),
            text: 'What does JSON stand for?',
            options: ['JavaScript Object Notation', 'Java Source Open Network', 'Joined Script Object Node', 'Java Syntax Object Name'],
            correctAnswer: 0
          },
          {
            id: uuid(),
            text: 'Which method converts JSON text into a JavaScript object?',
            options: ['JSON.make()', 'JSON.parse()', 'JSON.stringify()', 'Object.json()'],
            correctAnswer: 1
          }
        ]
      }
    ],
    results: []
  };
}

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(createSeedData(), null, 2));
  }
}

async function readDb() {
  ensureDatabase();
  const raw = await fs.promises.readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(data) {
  await fs.promises.writeFile(dbPath, JSON.stringify(data, null, 2));
  return data;
}

module.exports = {
  readDb,
  writeDb,
  ensureDatabase
};
