# 🚀 OpenForge — Your First Open-Source PR in Minutes

**Beginners shouldn't struggle to find their first open-source contribution.** OpenForge surfaces hand-picked, beginner-friendly GitHub issues in seconds—cutting discovery time from hours to minutes.

## ⚡ Try It in 10 Seconds

1. Open: **https://open-forge.netlify.app/**
2. Search: `"react"` or `"vue"`
3. Click a project → instantly explore beginner-friendly issues

**Live endpoints:**
- Frontend: https://open-forge.netlify.app/
- Backend API: https://openforge-48r0.onrender.com/api

> **Note:** Backend runs on free tier. First request takes 20–40 seconds (cold start). Subsequent requests are instant.

## 💡 Why I Built This

Finding my first open-source issue took hours of GitHub searching. Most beginners give up before their first PR.

OpenForge was built to solve that friction—indexing 500+ hand-picked repositories and surfacing real-time "good first issue" opportunities without the noise.

## ✨ What Makes It Different

| Feature | Benefit |
|---------|---------|
| **Curated projects** | Community-submitted, hand-vetted repos (not scraped noise) |
| **Live GitHub lookups** | Real-time issues with 15-minute caching for speed |
| **Smart filtering** | Search by project, tech stack, tags, difficulty level |
| **Safe rendering** | No XSS risk — all user content sanitized via DOM APIs |
| **Production-ready** | Deployed on Netlify + Render with proper CORS & error handling |

## Screenshots

### Home Page — Your First Open-Source PR Starts Here
The landing page highlights OpenForge's mission with a hero banner, showing "Now indexing 500+ beginner issues" and search functionality.
<img width="1887" height="882" alt="screenshot-1780851625659" src="https://github.com/user-attachments/assets/cb90de2a-ecdf-42f4-b07e-148b6ee36b59" />

### Explore Open Source Projects
Browse curated projects with filtering by technology, difficulty level, and sorting options. Each project card displays difficulty badges and project descriptions.
<img width="1885" height="882" alt="screenshot-1780851687793" src="https://github.com/user-attachments/assets/5b813889-3cb0-4e34-801b-9f155f8658e2" />

### Beginner-Friendly Issues
Search and filter "good first issue" opportunities pulled directly from OpenForge repositories. Results are cached for performance with refresh controls.
<img width="1884" height="882" alt="screenshot-1780851715254" src="https://github.com/user-attachments/assets/66ee9f43-2486-4259-a1b8-6ca6ae50997f" />

### Submit a Project
Community members can easily add their repositories to OpenForge to help beginners discover them. Simple form for project name, description, GitHub URL, tags, and difficulty level.
<img width="1883" height="882" alt="screenshot-1780851746508" src="https://github.com/user-attachments/assets/e595293f-73f5-4994-91f7-86088c1dddd7" />

## Tech Stack

- **Frontend**: Static HTML / CSS / Vanilla JS (zero build complexity)
- **Backend**: Python Flask + GitHub API integration
- **Testing**: Python unittest suite
- **Deployment**: Netlify (frontend) + Render (backend)

## 🏗️ Quick Start (Local Development)

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                      # Dev server at http://127.0.0.1:5000
```

Or run production-like:

```bash
gunicorn backend.app:app --bind 0.0.0.0:5000
```

**Environment variables** (optional `.env` file):
- `GITHUB_TOKEN`: GitHub API token for higher rate limits (recommended).
- `ALLOWED_ORIGIN`: Comma-separated CORS origins (default: all origins allowed).

### Frontend Setup

```bash
cd frontend
python -m http.server 5500
# Open http://127.0.0.1:5500/index.html
```

To point at a custom API URL:

```bash
API_URL=http://127.0.0.1:5000/api bash ../scripts/generate-config.sh
```

### Run Tests

```bash
python -m unittest backend.test_app -v
```

## 📡 API Reference

### `GET /api/projects`

List all indexed repositories.

**Query parameters:**
- `query`: Search by name, description, or tags (case-insensitive).
- `tag`: Filter by tag (exact match, case-insensitive).
- `difficulty`: Filter by difficulty (`Easy`, `Medium`, `Hard`).
- `sort`: Sort by `name`, `difficulty`, or `oldest` (default: insertion order).

**Example:**

```bash
curl "http://127.0.0.1:5000/api/projects?query=react&difficulty=Easy&sort=name"
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "React",
    "description": "A JavaScript library for building user interfaces.",
    "githubUrl": "https://github.com/facebook/react",
    "tags": ["javascript", "frontend", "ui"],
    "difficulty": "Medium"
  }
]
```

### `POST /api/projects`

Submit a new repository to the index.

**Request body:**

```json
{
  "name": "Project Name",
  "description": "Brief description.",
  "githubUrl": "https://github.com/owner/repo",
  "tags": ["javascript", "frontend"],
  "difficulty": "Easy"
}
```

**Validation:**
- All fields required.
- `githubUrl` must be a valid http/https GitHub URL.
- `difficulty` must be `Easy`, `Medium`, or `Hard`.
- At least one tag required (comma-separated string or array).

**Response (201):**

```json
{
  "message": "Project added successfully!",
  "project": { /* submitted project */ }
}
```

### `GET /api/issues`

Fetch live "good first issue" items from indexed repositories.

**Query parameters:**
- `query`: Optional search term (passed to GitHub API).

**Example:**

```bash
curl "http://127.0.0.1:5000/api/issues?query=documentation"
```

**Response:**

```json
[
  {
    "id": 12345,
    "title": "Add documentation for new feature",
    "repoLink": "https://github.com/owner/repo",
    "issueLink": "https://github.com/owner/repo/issues/123"
  }
]
```

## 🏭 Architecture

| Component | Choice | Why |
|-----------|--------|-----|
| **Data storage** | Single JSON file (`backend/data.json`) | Simple, fast for demo scope |
| **Issue caching** | 15-min in-memory TTL | Balances freshness & GitHub API limits |
| **Thread safety** | RLock + Lock primitives | Safe concurrent reads/writes |
| **GitHub integration** | Search API + "good first issue" label | Real-time, authoritative data |

## 🔒 Security & Best Practices

- ✅ **No secrets in repo** — use `.env` file (ignored in git)
- ✅ **CORS configured** — restrict origins via `ALLOWED_ORIGIN` env var
- ✅ **XSS-safe rendering** — all user content via `.textContent` & `.setAttribute` (never `.innerHTML`)
- ✅ **Error handling** — graceful API fallbacks, no stack traces exposed

## 📋 Known Limitations & Roadmap

| Limitation | Impact | Solution |
|-----------|--------|----------|
| Single JSON file storage | Not horizontally scalable | Replace with PostgreSQL (v2) |
| 15-min cache TTL | Stale data during window | Redis for distributed caching |
| No auth on POST | Anyone can submit projects | Add API key authentication (v2) |
| In-memory cache | Lost on restart | Memcached for multi-instance setup |

## 🚀 Deployment

### Backend (Render)

1. Connect your GitHub repository.
2. Build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn backend.app:app --bind 0.0.0.0:$PORT`
4. Add environment variables:
   - `GITHUB_TOKEN` (do NOT commit this)
   - `ALLOWED_ORIGIN` (if restricting CORS)
5. Deploy.

Alternatively, use the `Procfile` for Heroku or similar platforms.

### Frontend (Netlify)

1. Connect your GitHub repository.
2. Build command: `bash ./scripts/generate-config.sh`
3. Publish directory: `frontend`
4. Set environment variable: `API_URL=https://your-backend-url/api`
5. Deploy.

The `netlify.toml` and `scripts/generate-config.sh` automatically inject the API URL into `frontend/config.js` at build time.

**Contribute / Contact**
- Open an issue or PR on the repository. Licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing to OpenForge

We welcome contributions of all levels, especially from participants of the **Elite Coders Summer of Code (ECSoC) 2026**! Please read our [Contributing Guide](CONTRIBUTING.md) for full instructions.

### 🏆 ECSoC 2026 Contribution Rules
Before contributing, please make sure you understand our rules:
- **Issue Assignment:** You must be assigned to an issue before writing code or submitting a PR. Unassigned PRs may be closed.
- **One PR per Issue:** Keep your PRs small and focused. Do not mix multiple issues in one PR.
- **UI Screenshots:** Include before/after screenshots for any interface changes.
- **Code Ownership:** If you submit generated code, you must review and verify it yourself.

---

## 🛠️ Development & Workflows

### Local Development
To run OpenForge locally:
1. **Backend (Flask):**
   ```bash
   cd backend
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   pip install -r requirements.txt
   python app.py
   ```
2. **Frontend (HTML/CSS/JS):**
   ```bash
   cd frontend
   # optional: point to local backend API
   API_URL=http://127.0.0.1:5000/api bash ../scripts/generate-config.sh
   python -m http.server 5500
   ```
   Open `http://127.0.0.1:5500/index.html` in your browser.

### Issue Workflow
1. **Explore:** Find a labeled issue or create a new one using our templates.
2. **Claim:** Request assignment by commenting on the issue.
3. **Priority:** Issue creators receive first priority to implement their own issues.
4. **Activity:** Assignees must show active progress. Inactivity of 3 days or more may result in reassignment.

### PR Workflow
1. **Fork & Branch:** Fork this repo, create a branch named `feature/issue-<num>-<desc>` or `bugfix/issue-<num>-<desc>`.
2. **Implement & Test:** Code your solution, run backend unit tests (`python -m unittest backend.test_app -v`), and verify frontend functionality with no console errors.
3. **Submit:** Open a PR using our PR Template. Link the issue (e.g., `Closes #12`).
4. **Review & Merge:** A maintainer will review, request changes if necessary, tag it with `ECSoC26`, and squash-merge once approved.

---

## 📐 Code Style
- **Python:** Follow PEP 8 guidelines.
- **Frontend:** Semantic HTML5, Vanilla CSS for responsive layouts, and safe DOM APIs (avoid `innerHTML` with user inputs).
- **Commits:** Follow Angular/Conventional Commits (e.g., `feat(ui): ...`, `fix(api): ...`).

---

## 👥 Community & Etiquette
We are dedicated to providing a welcoming, diverse, and safe environment for all contributors. Please review our [Code of Conduct](CODE_OF_CONDUCT.md) for details on expected behavior and reporting guidelines.

---
**Made for hackathon. Ready for production.**
