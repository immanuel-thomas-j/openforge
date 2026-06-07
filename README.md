# OpenForge

## Problem
Finding beginner-friendly open source projects and issues is difficult for new contributors.

## Solution
OpenForge provides a curated platform for discovering open source projects and live GitHub issues suitable for beginners.

## Features
- Browse projects
- Search and filter projects
- Live GitHub issues feed
- Submit new projects
- Responsive UI

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Flask
- API: GitHub REST API

## Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
python -m http.server 5500
```

## Running Tests
```bash
python -m unittest backend.test_app -v
```

## Screenshots
(Add screenshots here)

## Demo Video
(Add YouTube/Loom link here)

## Live Demo
Frontend (Netlify): https://open-forge.netlify.app/
Backend (Render): https://openforge-48r0.onrender.com/

## License
MIT

---

No placeholder usernames or test projects remain in `backend/data.json`. Keep secrets out of the repository; only `backend/.env.example` should be present.
 
## About this README
This README is written to give judges and contributors a quick, 30–60 second overview and clear next steps for running and evaluating the project locally.

---

## Project Summary
OpenForge is a lightweight discovery platform that helps new contributors find beginner-friendly open-source projects and live GitHub issues labeled as good-first-issue. It is intentionally minimal so it can be extended for hackathon demos and quick deployments.

Key points:
- Curated project list stored in `backend/data.json`.
- Live issues fed from GitHub's REST API with short caching to stay responsive.
- Simple Flask backend and static frontend (HTML/CSS/JS) so judges can run it locally without build steps.

## Quick Demo (30s)
1. Start the backend:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

2. In a separate shell serve the frontend (or open HTML directly):

```bash
cd frontend
python -m http.server 5500
# then open http://127.0.0.1:5500/index.html
```

3. Browse `Explore Projects` and `Beginner Issues`.

## Features
- Curated projects with tags and difficulty
- Search and filter projects by query, tag, and difficulty
- Live GitHub issues feed (good-first-issue label) across submitted repos
- Add/submit new projects via a small form
- Accessible and responsive static frontend

## Tech Stack & Files
- Frontend: static HTML/CSS/JS — see `frontend/` (index.html, explore.html, issues.html, add.html, app.js, style.css)
- Backend: Flask API — see `backend/app.py`
- Tests: unit tests for the backend API — `backend/test_app.py`
- Data: JSON file storage — `backend/data.json`

## API Endpoints
- `GET /api/projects` — returns all projects (supports query, tag, difficulty, sort)
- `POST /api/projects` — submit a new project (JSON payload)
- `GET /api/issues` — fetch live issues from GitHub based on submitted projects

Example: `GET /api/projects?query=react&difficulty=Hard&sort=name`

## Environment variables
- `backend/.env.example` contains the recommended env variables.
- `GITHUB_TOKEN` (optional): add to `backend/.env` to increase GitHub API rate limits.

### Frontend API configuration
If you host the frontend separately from the backend, you can override the API endpoint by adding a small script tag before `app.js` in the HTML pages:

```html
<script>window.OPENFORGE_API_URL = 'https://your-backend.example.com/api'</script>
<script src="app.js"></script>
```

## Running Tests
Run the unit tests (backend):

```bash
python -m unittest backend.test_app -v
```

## Security & Secrets
- Do NOT commit `backend/.env` — only `backend/.env.example` should be present.
- Confirm `.gitignore` excludes `.env` (already present).

## Recommended Additions Before Submission
These make the repo easier for judges to evaluate quickly:
- Add 3 screenshots in `frontend/screenshots/` (landing, explore, issue view).
- Add a short demo GIF or Loom link in the README.
- Add `.github/workflows/ci.yml` to run unit tests on push/PR.
- Add `CONTRIBUTING.md` with a short contribution guide and a `CODE_OF_CONDUCT.md`.

## Deployment Notes
The app is intentionally simple — you can deploy the backend to any platform that supports Python/Flask (Heroku, Railway, Render, Azure Web Apps) and host the frontend as static files. For a quick demo, run the backend locally and serve the frontend via `http.server`.

Production checklist / quick deploy notes
- Backend (Render): start with Gunicorn — `gunicorn backend.app:app --bind 0.0.0.0:$PORT`. Add `GITHUB_TOKEN` in Render environment settings (do NOT commit it).
- Frontend (Netlify): we generate `frontend/config.js` at build time using the `API_URL` environment variable (see `netlify.toml` and `scripts/generate-config.sh`). Make sure `API_URL` is set to your Render backend URL (e.g. `https://openforge-48r0.onrender.com/api`).

If you are running the app locally for testing:
1. Backend (local):
```bash
cd backend
pip install -r requirements.txt
# dev server (not for production)
python app.py
```
Or run with Gunicorn (closer to production):
```bash
pip install -r requirements.txt
gunicorn backend.app:app --bind 0.0.0.0:5000
```

2. Frontend (local):
```bash
cd frontend
# generate runtime config if needed:
API_URL=http://127.0.0.1:5000/api bash ../scripts/generate-config.sh
python -m http.server 5500
# open http://127.0.0.1:5500/index.html
```

Security note
- Remove and rotate any GitHub tokens if they were accidentally stored in `backend/.env`. Ensure `backend/.env` is listed in `.gitignore` and not tracked by git.

## Contributing
If you'd like to contribute, please:
1. Fork the repository
2. Create a branch for your feature
3. Open a pull request describing the change

## Contact
If you need help running the project, open an issue or reach out via the repository's issue tracker after you push the repo to GitHub.

---

If you want, I can now:
- initialize a local Git repository and make the initial commit,
- add a basic GitHub Actions CI workflow that runs the tests, or
- generate 3 placeholder screenshots and add them to `frontend/screenshots/`.

Tell me which and I'll do it next.
