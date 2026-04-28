# Online Test Platform with Instant Results

## Overview
Online Test Platform is a full-stack web application where admins can create and manage tests, and students can attempt tests with a timer and get instant results after submission.

The project includes:
- User authentication
- Admin panel for test creation and user management
- Student panel for attempting tests
- Instant result generation
- Timer-based auto submit
- Basic anti-cheating controls
- Backend result storage

---

## Features

### Authentication
- Register
- Login
- Logout
- JWT-based session handling

### Admin Features
- Create tests
- Add dynamic questions
- Add options and correct answers
- Manage users
- View results

### Student Features
- View available tests
- Attempt tests with timer
- Navigate between questions
- Submit test manually
- Auto-submit when timer ends
- View instant score and answer review

### Result System
- Immediate score after submission
- Correct vs incorrect answers
- Percentage calculation
- Result history stored in backend

### Basic Proctoring / Anti-Cheating
- Disable copy
- Disable paste
- Disable right click
- Warn on tab switching
- Store tab-switch warning count with results

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Storage
- JSON-based temporary storage

### Authentication
- JWT
- bcryptjs

---

## Project Structure

```bash
proj-dev2/
│
├── client/
│   ├── css/
│   ├── js/
│   └── index.html
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── data/
│   └── app.js
│
├── node_modules/
├── package.json
├── package-lock.json
└── render.yaml
