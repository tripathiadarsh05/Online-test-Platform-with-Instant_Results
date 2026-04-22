const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const dataDir = path.join(__dirname, '..', 'data');
const files = {
  users: path.join(dataDir, 'users.json'),
  tests: path.join(dataDir, 'tests.json'),
  results: path.join(dataDir, 'results.json')
};

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(files.users)) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const studentPassword = bcrypt.hashSync('student123', 10);
    writeData('users', [
      {
        id: uuid(),
        name: 'Admin User',
        email: 'admin@test.com',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: uuid(),
        name: 'Student User',
        email: 'student@test.com',
        password: studentPassword,
        role: 'student',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  if (!fs.existsSync(files.tests)) {
    writeData('tests', [
      {
        id: uuid(),
        title: 'JavaScript Fundamentals',
        duration: 10,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: uuid(),
            text: 'Which keyword declares a block-scoped variable?',
            options: ['var', 'let', 'function', 'className'],
            correctIndex: 1
          },
          {
            id: uuid(),
            text: 'What does JSON stand for?',
            options: ['JavaScript Object Notation', 'Java Source Open Network', 'Joined Server Object Node', 'JavaScript Ordered Name'],
            correctIndex: 0
          },
          {
            id: uuid(),
            text: 'Which array method creates a new transformed array?',
            options: ['forEach', 'push', 'map', 'splice'],
            correctIndex: 2
          }
        ]
      }
    ]);
  }

  if (!fs.existsSync(files.results)) {
    writeData('results', []);
  }
}

async function readData(collection) {
  ensureDataFiles();
  const raw = await fs.promises.readFile(files[collection], 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeDataAsync(collection, data) {
  ensureDataFiles();
  await fs.promises.writeFile(files[collection], JSON.stringify(data, null, 2));
}

function writeData(collection, data) {
  fs.writeFileSync(files[collection], JSON.stringify(data, null, 2));
}

module.exports = { ensureDataFiles, readData, writeDataAsync };
