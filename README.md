# Mergington High School Activities API

FastAPI application for managing school extracurricular activities, with a browser UI for teachers to register and unregister students.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Teacher Authentication](#teacher-authentication)
- [API Reference](#api-reference)
- [Example Requests](#example-requests)
- [Frontend UI](#frontend-ui)
- [Data and Persistence](#data-and-persistence)
- [Troubleshooting](#troubleshooting)

## Overview

This project exposes an activities API and serves a small web interface from the same FastAPI app. Teachers can log in, then register or unregister student emails for each activity.

## Features

- List all activities and current participants
- Teacher login and logout using token-based auth
- Register a student for an activity
- Unregister a student from an activity
- Built-in static frontend at `/static/index.html`
- Automatic root redirect from `/` to the web UI

## Project Structure

```
.
|-- README.md
|-- requirements.txt
`-- src
    |-- app.py
    |-- teachers.json
    |-- README.md
    `-- static
        |-- index.html
        |-- app.js
        `-- styles.css
```

## Requirements

- Python 3.10+
- pip

Dependencies are listed in `requirements.txt`:

- fastapi
- uvicorn

## Quick Start

1. Clone the repository.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the app from the repository root:

```bash
uvicorn src.app:app --reload
```

4. Open:

- Frontend UI: http://localhost:8000/
- Swagger docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Teacher Authentication

- Login endpoint returns a token.
- Protected endpoints require the `X-Teacher-Token` header.
- The frontend stores the token in browser local storage.

Teacher accounts for local testing are defined in `src/teachers.json`.

## API Reference

### `GET /activities`

Returns all activities, including description, schedule, capacity, and participant emails.

### `POST /auth/login`

Logs in a teacher.

Request body:

```json
{
  "username": "teacher.alex",
  "password": "mergington123"
}
```

Success response:

```json
{
  "message": "Login successful",
  "token": "<generated_token>",
  "username": "teacher.alex"
}
```

### `POST /auth/logout`

Logs out a teacher and invalidates the current token.

Header:

- `X-Teacher-Token: <token>`

### `POST /activities/{activity_name}/signup?email={student_email}`

Registers a student for an activity.

Header:

- `X-Teacher-Token: <token>`

### `DELETE /activities/{activity_name}/unregister?email={student_email}`

Unregisters a student from an activity.

Header:

- `X-Teacher-Token: <token>`

## Example Requests

Login and save token:

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher.alex","password":"mergington123"}'
```

Get activities:

```bash
curl "http://localhost:8000/activities"
```

Register a student:

```bash
curl -X POST "http://localhost:8000/activities/Chess%20Club/signup?email=student@mergington.edu" \
  -H "X-Teacher-Token: <token>"
```

Unregister a student:

```bash
curl -X DELETE "http://localhost:8000/activities/Chess%20Club/unregister?email=student@mergington.edu" \
  -H "X-Teacher-Token: <token>"
```

## Frontend UI

The app serves a simple teacher-facing UI from `src/static`:

- `index.html`: layout and modals
- `app.js`: API calls, auth state, register/unregister actions
- `styles.css`: page and component styling

When not logged in, registration and removal actions are blocked.

## Data and Persistence

- Activity data is held in memory in `src/app.py`.
- Teacher sessions (tokens) are also in memory.
- Restarting the server resets activity participants and active sessions.

## Troubleshooting

- `ModuleNotFoundError`: install dependencies with `pip install -r requirements.txt`.
- Port already in use: free port `8000` or run with `uvicorn src.app:app --reload --port 8001`.
- `401 Teacher authentication required`: pass a valid `X-Teacher-Token`.
- `404 Activity not found`: verify `activity_name` and URL encoding.

## License

This project is licensed under the MIT License. See `LICENSE` for details.

