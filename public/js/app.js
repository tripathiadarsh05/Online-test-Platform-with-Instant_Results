const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  tests: [],
  results: [],
  users: [],
  activeTab: 'tests',
  activeTest: null,
  activeQuestion: 0,
  answers: [],
  timerId: null,
  remainingSeconds: 0,
  tabSwitches: 0,
  submittedResult: null
};

const app = document.getElementById('app');

function api(path, options = {}) {
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  });
}

function setSession(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

function clearSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  state.user = null;
  state.token = null;
  stopTimer();
  renderAuth();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderAuth(mode = 'login', message = '') {
  app.innerHTML = `
    <main class="auth-wrap">
      <header class="auth-header">
        <div class="brand brand-row">
          <span class="logo-mark">OT</span>
          <div>
            <strong>Online Test Platform</strong>
            <span class="muted">Secure exams with instant results</span>
          </div>
        </div>
        <span class="badge">JWT Secured</span>
      </header>
      <section class="auth-card">
        <h1>${mode === 'login' ? 'Login' : 'Create Account'}</h1>
        <p class="muted">Admin: admin@test.com / admin123<br />Student: student@test.com / student123</p>
        ${message ? `<p class="error">${escapeHtml(message)}</p>` : ''}
        <form id="authForm">
          ${mode === 'register' ? '<label>Name<input name="name" required /></label>' : ''}
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          <button class="btn" type="submit">${mode === 'login' ? 'Login' : 'Register'}</button>
        </form>
        <p>
          ${mode === 'login' ? 'Need an account?' : 'Already registered?'}
          <button class="btn secondary small" id="toggleAuth">${mode === 'login' ? 'Register' : 'Login'}</button>
        </p>
      </section>
      <footer class="app-footer auth-footer">
        <span>Online Test Platform</span>
        <span>Authentication - Admin Controls - Instant Scoring</span>
      </footer>
    </main>
  `;

  document.getElementById('toggleAuth').addEventListener('click', () => {
    renderAuth(mode === 'login' ? 'register' : 'login');
  });

  document.getElementById('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const data = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setSession(data.user, data.token);
      await loadDashboard();
    } catch (error) {
      renderAuth(mode, error.message);
    }
  });
}

function layout(content) {
  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div class="brand brand-row">
          <span class="logo-mark">OT</span>
          <div>
            <strong>Online Test Platform</strong>
            <span class="muted">${escapeHtml(state.user.name)} - ${escapeHtml(state.user.role)}</span>
          </div>
        </div>
        <div class="top-actions">
          <span class="nav-pill">${state.user.role === 'admin' ? 'Admin Workspace' : 'Student Workspace'}</span>
          <button class="btn secondary" id="refreshBtn">Refresh</button>
          <button class="btn danger" id="logoutBtn">Logout</button>
        </div>
      </header>
      ${content}
      <footer class="app-footer">
        <span>Online Test Platform</span>
        <span>REST API - Timer Auto Submit - Result History</span>
      </footer>
    </main>
  `;

  document.getElementById('logoutBtn').addEventListener('click', clearSession);
  document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
}

async function loadDashboard() {
  if (!state.token || !state.user) return renderAuth();

  try {
    const [testsData, resultsData] = await Promise.all([
      api('/tests'),
      api('/results')
    ]);
    state.tests = testsData.tests;
    state.results = resultsData.results;

    if (state.user.role === 'admin') {
      const usersData = await api('/users');
      state.users = usersData.users;
      renderAdmin();
    } else {
      renderStudent();
    }
  } catch (error) {
    clearSession();
  }
}

function renderStudent() {
  layout(`
    <section class="tabs">
      <button class="btn tab ${state.activeTab === 'tests' ? 'active' : ''}" data-tab="tests">Available Tests</button>
      <button class="btn tab ${state.activeTab === 'results' ? 'active' : ''}" data-tab="results">My Results</button>
    </section>
    ${state.activeTab === 'tests' ? renderTestList() : renderResults()}
  `);

  bindTabs(renderStudent);
  bindStartTest();
}

function renderTestList() {
  return `
    <section class="grid">
      ${state.tests.map((test) => `
        <article class="list-card">
          <header>
            <div>
              <h3>${escapeHtml(test.title)}</h3>
              <span class="muted">${test.questions.length} questions - ${test.duration} minutes</span>
            </div>
            <button class="btn start-test" data-id="${test.id}">Start</button>
          </header>
        </article>
      `).join('') || '<p class="muted">No tests available.</p>'}
    </section>
  `;
}

function renderResults() {
  return `
    <section class="card-list">
      ${state.results.map((result) => `
        <article class="result-item">
          <h3>${escapeHtml(result.testTitle)}</h3>
          <p><span class="badge">${result.score}/${result.total}</span> ${result.percentage}% - ${new Date(result.submittedAt).toLocaleString()}</p>
          <p class="muted">Tab switch warnings: ${result.tabSwitches}${result.autoSubmitted ? ' - Auto-submitted by timer' : ''}</p>
        </article>
      `).join('') || '<p class="muted">No results yet.</p>'}
    </section>
  `;
}

function bindTabs(renderer) {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeTab = button.dataset.tab;
      renderer();
    });
  });
}

function bindStartTest() {
  document.querySelectorAll('.start-test').forEach((button) => {
    button.addEventListener('click', async () => {
      const data = await api(`/tests/${button.dataset.id}`);
      startTest(data.test);
    });
  });
}

function startTest(test) {
  state.activeTest = test;
  state.activeQuestion = 0;
  state.answers = Array(test.questions.length).fill(null);
  state.remainingSeconds = test.duration * 60;
  state.tabSwitches = 0;
  state.submittedResult = null;
  renderAttempt();
  startTimer();
}

function startTimer() {
  stopTimer();
  state.timerId = setInterval(() => {
    state.remainingSeconds -= 1;
    const timer = document.getElementById('timer');
    if (timer) timer.textContent = formatTime(state.remainingSeconds);
    if (state.remainingSeconds <= 0) submitAttempt(true);
  }, 1000);
}

function stopTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function renderAttempt() {
  const test = state.activeTest;
  const question = test.questions[state.activeQuestion];

  layout(`
    <section class="panel">
      <div class="row" style="justify-content: space-between">
        <div>
          <h2>${escapeHtml(test.title)}</h2>
          <span class="muted">Question ${state.activeQuestion + 1} of ${test.questions.length}</span>
        </div>
        <div class="timer" id="timer">${formatTime(state.remainingSeconds)}</div>
      </div>
      <div class="question-nav">
        ${test.questions.map((_, index) => `
          <button class="q-dot ${index === state.activeQuestion ? 'active' : ''} ${state.answers[index] !== null ? 'answered' : ''}" data-q="${index}">${index + 1}</button>
        `).join('')}
      </div>
      <div class="question-box">
        <h3>${escapeHtml(question.text)}</h3>
        ${question.options.map((option, index) => `
          <label class="option">
            <input type="radio" name="answer" value="${index}" ${state.answers[state.activeQuestion] === index ? 'checked' : ''} />
            ${escapeHtml(option)}
          </label>
        `).join('')}
      </div>
      <div class="form-actions" style="margin-top: 16px">
        <button class="btn secondary" id="prevBtn">Previous</button>
        <button class="btn secondary" id="nextBtn">Next</button>
        <button class="btn success" id="submitBtn">Submit Test</button>
      </div>
      <p class="muted">Copy, paste, right click and tab switching are monitored during the test.</p>
    </section>
  `);

  document.querySelectorAll('.q-dot').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeQuestion = Number(button.dataset.q);
      renderAttempt();
    });
  });

  document.querySelectorAll('input[name="answer"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.answers[state.activeQuestion] = Number(input.value);
      renderAttempt();
    });
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    state.activeQuestion = Math.max(0, state.activeQuestion - 1);
    renderAttempt();
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    state.activeQuestion = Math.min(test.questions.length - 1, state.activeQuestion + 1);
    renderAttempt();
  });

  document.getElementById('submitBtn').addEventListener('click', () => submitAttempt(false));
}

async function submitAttempt(autoSubmitted) {
  if (!state.activeTest || state.submittedResult) return;
  stopTimer();

  const data = await api('/results/submit', {
    method: 'POST',
    body: JSON.stringify({
      testId: state.activeTest.id,
      answers: state.answers,
      tabSwitches: state.tabSwitches,
      autoSubmitted
    })
  });

  state.submittedResult = data.result;
  renderInstantResult();
}

function renderInstantResult() {
  const result = state.submittedResult;
  layout(`
    <section class="panel">
      <h2>Instant Result</h2>
      <p><span class="badge">${result.score}/${result.total}</span> ${result.percentage}%</p>
      <p class="muted">Tab switch warnings: ${result.tabSwitches}${result.autoSubmitted ? ' - Auto-submitted by timer' : ''}</p>
      <div class="card-list">
        ${result.answers.map((answer, index) => `
          <article class="result-item ${answer.isCorrect ? 'correct' : 'incorrect'}">
            <h3>${index + 1}. ${escapeHtml(answer.questionText)}</h3>
            <p>Your answer: ${answer.selectedAnswer === null ? 'Not answered' : escapeHtml(answer.options[answer.selectedAnswer])}</p>
            <p>Correct answer: ${escapeHtml(answer.options[answer.correctAnswer])}</p>
          </article>
        `).join('')}
      </div>
      <button class="btn" id="backDashboard">Back to Dashboard</button>
    </section>
  `);

  document.getElementById('backDashboard').addEventListener('click', async () => {
    state.activeTest = null;
    await loadDashboard();
  });
}

function renderAdmin() {
  layout(`
    <section class="tabs">
      <button class="btn tab ${state.activeTab === 'tests' ? 'active' : ''}" data-tab="tests">Tests</button>
      <button class="btn tab ${state.activeTab === 'users' ? 'active' : ''}" data-tab="users">Users</button>
      <button class="btn tab ${state.activeTab === 'results' ? 'active' : ''}" data-tab="results">Results</button>
    </section>
    ${state.activeTab === 'users' ? renderUserAdmin() : state.activeTab === 'results' ? renderAdminResults() : renderTestAdmin()}
  `);

  bindTabs(renderAdmin);
  bindAdminActions();
}

function renderTestAdmin() {
  return `
    <section class="grid">
      <div class="panel">
        <h2>Create Test</h2>
        <form id="testForm">
          <label>Title<input name="title" required /></label>
          <label>Duration in minutes<input name="duration" type="number" min="1" value="10" required /></label>
          <div id="questionEditors"></div>
          <button class="btn secondary" type="button" id="addQuestionBtn">Add Question</button>
          <button class="btn" type="submit">Save Test</button>
        </form>
      </div>
      <div class="panel">
        <h2>Existing Tests</h2>
        <div class="card-list">
          ${state.tests.map((test) => `
            <article class="list-card">
              <header>
                <div>
                  <h3>${escapeHtml(test.title)}</h3>
                  <span class="muted">${test.questions.length} questions - ${test.duration} minutes</span>
                </div>
                <button class="btn danger small delete-test" data-id="${test.id}">Delete</button>
              </header>
            </article>
          `).join('') || '<p class="muted">No tests yet.</p>'}
        </div>
      </div>
    </section>
  `;
}

function renderQuestionEditor(index) {
  return `
    <div class="question-editor">
      <label>Question<input name="questionText" required /></label>
      <div class="two-col">
        <label>Option 1<input name="option0" required /></label>
        <label>Option 2<input name="option1" required /></label>
        <label>Option 3<input name="option2" required /></label>
        <label>Option 4<input name="option3" required /></label>
      </div>
      <label>Correct Answer
        <select name="correctAnswer">
          <option value="0">Option 1</option>
          <option value="1">Option 2</option>
          <option value="2">Option 3</option>
          <option value="3">Option 4</option>
        </select>
      </label>
      <button class="btn danger small remove-question" type="button">Remove</button>
    </div>
  `;
}

function renderUserAdmin() {
  return `
    <section class="grid">
      <div class="panel">
        <h2>Add User</h2>
        <form id="userForm">
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          <label>Role
            <select name="role">
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button class="btn" type="submit">Add User</button>
        </form>
      </div>
      <div class="panel">
        <h2>Manage Users</h2>
        <div class="card-list">
          ${state.users.map((user) => `
            <article class="list-card">
              <header>
                <div>
                  <h3>${escapeHtml(user.name)}</h3>
                  <span class="muted">${escapeHtml(user.email)} - ${escapeHtml(user.role)}</span>
                </div>
                ${user.id === state.user.id ? '<span class="badge">You</span>' : `<button class="btn danger small delete-user" data-id="${user.id}">Delete</button>`}
              </header>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderAdminResults() {
  return `
    <section class="card-list">
      ${state.results.map((result) => `
        <article class="result-item">
          <h3>${escapeHtml(result.testTitle)}</h3>
          <p><span class="badge">${result.score}/${result.total}</span> ${result.percentage}%</p>
          <p class="muted">${escapeHtml(result.user?.name || 'Deleted user')} - ${new Date(result.submittedAt).toLocaleString()} - Tab switches: ${result.tabSwitches}</p>
        </article>
      `).join('') || '<p class="muted">No submissions yet.</p>'}
    </section>
  `;
}

function bindAdminActions() {
  const questionEditors = document.getElementById('questionEditors');
  const addQuestionBtn = document.getElementById('addQuestionBtn');

  if (questionEditors && addQuestionBtn) {
    const addEditor = () => {
      questionEditors.insertAdjacentHTML('beforeend', renderQuestionEditor(questionEditors.children.length));
    };
    addEditor();
    addQuestionBtn.addEventListener('click', addEditor);
    questionEditors.addEventListener('click', (event) => {
      if (event.target.classList.contains('remove-question') && questionEditors.children.length > 1) {
        event.target.closest('.question-editor').remove();
      }
    });
  }

  const testForm = document.getElementById('testForm');
  if (testForm) {
    testForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(testForm);
      const editors = [...document.querySelectorAll('.question-editor')];
      const questionEntries = editors.map((editor) => {
        return {
          text: editor.querySelector('[name="questionText"]').value,
          options: [
            editor.querySelector('[name="option0"]').value,
            editor.querySelector('[name="option1"]').value,
            editor.querySelector('[name="option2"]').value,
            editor.querySelector('[name="option3"]').value
          ],
          correctAnswer: Number(editor.querySelector('[name="correctAnswer"]').value)
        };
      });

      await api('/tests', {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'),
          duration: Number(form.get('duration')),
          questions: questionEntries
        })
      });
      await loadDashboard();
    });
  }

  document.querySelectorAll('.delete-test').forEach((button) => {
    button.addEventListener('click', async () => {
      await api(`/tests/${button.dataset.id}`, { method: 'DELETE' });
      await loadDashboard();
    });
  });

  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await api('/users', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(userForm).entries()))
      });
      await loadDashboard();
    });
  }

  document.querySelectorAll('.delete-user').forEach((button) => {
    button.addEventListener('click', async () => {
      await api(`/users/${button.dataset.id}`, { method: 'DELETE' });
      await loadDashboard();
    });
  });
}

document.addEventListener('copy', (event) => {
  if (state.activeTest) event.preventDefault();
});

document.addEventListener('paste', (event) => {
  if (state.activeTest) event.preventDefault();
});

document.addEventListener('contextmenu', (event) => {
  if (state.activeTest) event.preventDefault();
});

document.addEventListener('visibilitychange', () => {
  if (state.activeTest && document.hidden) {
    state.tabSwitches += 1;
    alert(`Tab switch warning ${state.tabSwitches}. Your activity will be saved with the result.`);
  }
});

loadDashboard();
