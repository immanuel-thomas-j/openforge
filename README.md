# OpenForge — Find Beginner-Friendly Open-Source Issues Fast

**Your first open-source PR starts here.** OpenForge indexes hand-picked GitHub repositories and surfaces "good first issue" items so new contributors can discover curated, low-friction tasks.

## Live Demo

- **Frontend** (Netlify): https://open-forge.netlify.app/
- **Backend** (Render): https://openforge-48r0.onrender.com/api

> **Note:** The backend runs on Render's free tier. The first request may take 20–40 seconds to respond (cold start). Subsequent requests are fast. If the API seems slow during testing, please wait.

## Why OpenForge?

- **Save time**: No more hunting through countless repos for beginner-friendly issues.
- **Curated projects**: Community-submitted, hand-picked repositories.
- **Live lookups**: Real-time GitHub issue searches with smart 15-minute caching.
- **Instant filtering**: Search by project name, description, tags, and difficulty.
- **Safe rendering**: User content rendered via safe DOM APIs — no raw HTML injection.

## Screenshots

### Home Page — Your First Open-Source PR Starts Here
The landing page highlights OpenForge's mission with a hero banner, showing "Now indexing 500+ beginner issues" and search functionality.

### Explore Open Source Projects
Browse curated projects with filtering by technology, difficulty level, and sorting options. Each project card displays difficulty badges and project descriptions.

### Beginner-Friendly Issues
Search and filter "good first issue" opportunities pulled directly from OpenForge repositories. Results are cached for performance with refresh controls.

### Submit a Project
Community members can easily add their repositories to OpenForge to help beginners discover them. Simple form for project name, description, GitHub URL, tags, and difficulty level.

## Tech Stack

- **Frontend**: Static HTML / CSS / Vanilla JS — zero build steps.
- **Backend**: Python Flask + requests.
- **Tests**: Python unittest.
- **Deployment**: Netlify (frontend) + Render (backend).

## Quick Start (Local Development)

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

## Deployment

### Backend (Render)

1. Connect your GitHub repository.
2. Set build command: `pip install -r requirements.txt`
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

## API Reference

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

## Architecture

- **Data persistence**: Single JSON file (`backend/data.json`) — fine for demo scope, not for horizontal scaling.
- **Issue caching**: In-memory 15-minute TTL (configurable via `ISSUE_CACHE_TTL_SECONDS` in `backend/app.py`).
- **Thread safety**: RLock for data reads/writes; regular Lock for issue cache.
- **GitHub API**: Uses search endpoint with "good first issue" label, respecting rate limits.

## Security & Best Practices

- **Do NOT commit** `.env` or `.github/workflows/` secrets. Rotate any leaked tokens immediately.
- **CORS**: Backend supports `ALLOWED_ORIGIN` env var to restrict frontend origins.
- **Safe rendering**: User content is injected via safe DOM APIs (`.textContent`, `.setAttribute`) — never unescaped `.innerHTML`.
- **No auth on POST**: Demo scope only. For production, add authentication and rate-limiting.

## Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| Single JSON file storage | Not horizontally scalable; data loss if not backed up. | Replace with PostgreSQL/MongoDB for production. |
| 15-minute issue cache | Stale data during that window. | Reduce TTL or implement real-time updates. |
| No authentication on POST | Anyone can submit projects (demo only). | Add API keys or OAuth before production. |
| In-memory cache | Resets on server restart; lost if multiple instances. | Use Redis or Memcached. |

## Project Highlights

**Completeness:**
- API endpoints (`GET /api/projects`, `POST /api/projects`, `GET /api/issues`) work as documented.
- Input validation and error handling across all endpoints.
- GitHub URL parsing and repo slug extraction.

**User Experience:**
- Project search, filtering, and sorting with instant results.
- Live issue lookups with real-time GitHub data.
- Responsive design across mobile, tablet, and desktop.

**Code Quality:**
- Comprehensive test suite: `python -m unittest backend.test_app -v`
- Thread-safe data handling with proper locking mechanisms.
- Clear separation of concerns between backend logic and frontend.

**Deployment:**
- Live demo links fully functional and maintained.
- Environment variable configuration for flexible deployments.
- CORS, caching, and error recovery all in place.

## Contributing

Found a bug or have a feature idea?

1. Open an [issue](https://github.com/immanuel-thomas-j/openforge/issues).
2. Submit a pull request with your changes.
3. Follow PEP 8 (backend) and semantic HTML best practices (frontend).

## License

MIT License — use and modify freely.
