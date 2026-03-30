# Source Folder Guide

This directory contains the runnable FastAPI service and static frontend.

## Contents

- `app.py`: FastAPI app, in-memory activities data, and authentication endpoints
- `teachers.json`: local teacher credentials used by the login endpoint
- `static/index.html`: frontend page
- `static/app.js`: frontend behavior for login, registration, and unregister actions
- `static/styles.css`: frontend styling

## Run from this Folder

Install dependencies from the repository root or this folder:

```bash
pip install -r ../requirements.txt
```

Start the app:

```bash
uvicorn app:app --reload
```

Open:

- UI: http://localhost:8000/
- Swagger: http://localhost:8000/docs

## Auth Notes

- Login: `POST /auth/login`
- Logout: `POST /auth/logout`
- Protected actions require `X-Teacher-Token`

Protected endpoints:

- `POST /activities/{activity_name}/signup?email=...`
- `DELETE /activities/{activity_name}/unregister?email=...`

## Important Behavior

- Data is in-memory only.
- Restarting the app clears active login sessions and activity changes.
