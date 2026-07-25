import json
import os
import threading
import time
import logging
from urllib.parse import urlparse

from dotenv import load_dotenv
from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
import redis

BACKEND_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

app = Flask(__name__)
# Configure CORS: allow restricting origins via ALLOWED_ORIGIN env var (comma-separated)
allowed_origins = os.environ.get("ALLOWED_ORIGIN", "").strip()
if allowed_origins:
    CORS(app, origins=[o.strip() for o in allowed_origins.split(",")])
else:
    CORS(app)

DATA_FILE = os.path.join(BACKEND_DIR, "data.json")
ALLOWED_DIFFICULTIES = {"Easy", "Medium", "Hard"}
GITHUB_ISSUE_SEARCH_URL = "https://api.github.com/search/issues"
GITHUB_ISSUE_LABEL = 'label:"good first issue"'
ISSUE_CACHE_TTL_SECONDS = 15 * 60
DATA_LOCK = threading.RLock()

# Initialize Redis Cache
REDIS_URL = os.environ.get("REDIS_URL")
if REDIS_URL:
    try:
        redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        redis_client.ping()
        logging.info("Connected to Redis successfully.")
    except Exception as e:
        logging.error(f"Failed to connect to Redis: {e}")
        redis_client = None
else:
    redis_client = None

# Fallback in-memory cache if Redis is unavailable
ISSUE_CACHE_LOCK = threading.Lock()
ISSUE_CACHE = {}


def _default_data():
    return {"projects": [], "issues": [], "next_project_id": 1}


def read_data():
    with DATA_LOCK:
        if not os.path.exists(DATA_FILE):
            data = _default_data()
            write_data(data)
            return data

        with open(DATA_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        if "projects" not in data:
            data["projects"] = []
        if "issues" not in data:
            data["issues"] = []

        return data


def write_data(data):
    with DATA_LOCK:
        if "next_project_id" not in data:
            data["next_project_id"] = _get_next_project_id(data)

        with open(DATA_FILE, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=2)


def _get_next_project_id(data):
    if isinstance(data.get("next_project_id"), int) and data["next_project_id"] > 0:
        return data["next_project_id"]

    numeric_ids = [project.get("id") for project in data.get("projects", []) if isinstance(project.get("id"), int)]
    return (max(numeric_ids) + 1) if numeric_ids else 1


def _normalize_tags(tags):
    if isinstance(tags, str):
        tags = [tag.strip() for tag in tags.split(",")]
    elif isinstance(tags, list):
        tags = [str(tag).strip() for tag in tags]
    else:
        return []

    return [tag for tag in tags if tag]


def _validate_github_url(url):
    parsed = urlparse(url or "")
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _validate_project_payload(payload):
    errors = {}

    name = (payload.get("name") or "").strip()
    description = (payload.get("description") or "").strip()
    github_url = (payload.get("githubUrl") or "").strip()
    difficulty = (payload.get("difficulty") or "").strip()
    tags = _normalize_tags(payload.get("tags"))

    if not name:
        errors["name"] = "Project name is required."
    if not description:
        errors["description"] = "Description is required."
    if not _validate_github_url(github_url):
        errors["githubUrl"] = "Enter a valid http or https URL."
    if difficulty not in ALLOWED_DIFFICULTIES:
        errors["difficulty"] = "Difficulty must be Easy, Medium, or Hard."
    if not tags:
        errors["tags"] = "Add at least one tag."

    if errors:
        return None, errors

    return {
        "name": name,
        "description": description,
        "githubUrl": github_url,
        "tags": tags,
        "difficulty": difficulty,
    }, None


def _difficulty_rank(difficulty):
    order = {"Easy": 0, "Medium": 1, "Hard": 2}
    return order.get(difficulty, 99)


def _filter_projects(projects, query=None, tag=None, difficulty=None):
    filtered = projects

    if query:
        query = query.lower()
        filtered = [
            project for project in filtered
            if query in project.get("name", "").lower()
            or query in project.get("description", "").lower()
            or any(query in str(project_tag).lower() for project_tag in project.get("tags", []))
        ]

    if tag:
        tag = tag.lower()
        filtered = [
            project for project in filtered
            if any(tag == str(project_tag).lower() for project_tag in project.get("tags", []))
        ]

    if difficulty:
        filtered = [
            project for project in filtered
            if project.get("difficulty") == difficulty
        ]

    return filtered


def _sort_projects(projects, sort_key):
    if sort_key == "name":
        return sorted(projects, key=lambda project: project.get("name", "").lower())
    if sort_key == "difficulty":
        return sorted(projects, key=lambda project: _difficulty_rank(project.get("difficulty")))
    if sort_key == "oldest":
        return list(reversed(projects))
    return projects


def _extract_github_repo_slug(github_url):
    parsed = urlparse(github_url or "")
    hostname = parsed.netloc.lower()

    if hostname not in {"github.com", "www.github.com"}:
        return None

    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2:
        return None

    owner, repo = parts[0], parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]

    if not owner or not repo:
        return None

    return f"{owner}/{repo}"


def _build_issue_query(repo_slug, search_term=""):
    query_parts = [
        "is:issue",
        "is:open",
        GITHUB_ISSUE_LABEL,
        "no:assignee",
        f"repo:{repo_slug}",
    ]

    if search_term:
        query_parts.append(search_term)

    return " ".join(query_parts)


def _github_request_headers():
    headers = {"Accept": "application/vnd.github.v3+json"}
    github_token = os.getenv("GITHUB_TOKEN", "").strip()

    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    return headers


def _get_cached_issues(cache_key):
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            logging.error(f"Redis get error: {e}")

    with ISSUE_CACHE_LOCK:
        cached = ISSUE_CACHE.get(cache_key)
        if not cached:
            return None

        if cached["expires_at"] <= time.monotonic():
            return None

        return cached["issues"]


def _get_issue_cache_entry(cache_key):
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return {"issues": json.loads(cached_data), "expires_at": float('inf')}
            return None
        except Exception as e:
            logging.error(f"Redis get error: {e}")

    with ISSUE_CACHE_LOCK:
        return ISSUE_CACHE.get(cache_key)


def _set_cached_issues(cache_key, issues):
    if redis_client:
        try:
            redis_client.setex(cache_key, ISSUE_CACHE_TTL_SECONDS, json.dumps(issues))
            return
        except Exception as e:
            logging.error(f"Redis set error: {e}")

    with ISSUE_CACHE_LOCK:
        ISSUE_CACHE[cache_key] = {
            "issues": issues,
            "expires_at": time.monotonic() + ISSUE_CACHE_TTL_SECONDS,
        }


def _clear_issue_cache():
    if redis_client:
        try:
            redis_client.flushdb()
            return
        except Exception as e:
            logging.error(f"Redis flush error: {e}")

    with ISSUE_CACHE_LOCK:
        ISSUE_CACHE.clear()


def _fetch_repo_issues(repo_slug, search_term=""):
    response = requests.get(
        GITHUB_ISSUE_SEARCH_URL,
        params={
            "q": _build_issue_query(repo_slug, search_term),
            "sort": "created",
            "order": "desc",
            "per_page": 5,
        },
        headers=_github_request_headers(),
        timeout=10,
    )
    response.raise_for_status()
    github_data = response.json()

    repo_issues = []
    for item in github_data.get("items", []):
        repo_api_url = item.get("repository_url", "")
        repo_web_url = repo_api_url.replace("https://api.github.com/repos/", "https://github.com/")

        repo_issues.append(
            {
                "id": item.get("id"),
                "title": item.get("title"),
                "repoLink": repo_web_url,
                "issueLink": item.get("html_url"),
            }
        )

    return repo_issues


def _collect_live_issues(search_term=""):
    data = read_data()
    repo_slugs = []
    seen = set()

    for project in data.get("projects", []):
        repo_slug = _extract_github_repo_slug(project.get("githubUrl"))
        if repo_slug and repo_slug not in seen:
            seen.add(repo_slug)
            repo_slugs.append(repo_slug)

    if not repo_slugs:
        return []

    cache_key = f"{search_term.lower()}|{'|'.join(repo_slugs)}"
    cached = _get_cached_issues(cache_key)
    if cached is not None:
        return cached

    stale_cache = _get_issue_cache_entry(cache_key)
    live_issues = []
    seen_issue_links = set()
    had_successful_request = False

    for repo_slug in repo_slugs:
        try:
            repo_issues = _fetch_repo_issues(repo_slug, search_term)
        except requests.exceptions.RequestException as error:
            print(f"GitHub API Error for {repo_slug}: {error}")
            continue

        had_successful_request = True

        for issue in repo_issues:
            issue_link = issue.get("issueLink")
            if issue_link and issue_link not in seen_issue_links:
                seen_issue_links.add(issue_link)
                live_issues.append(issue)

    if live_issues:
        _set_cached_issues(cache_key, live_issues)
        return live_issues

    if stale_cache:
        return stale_cache["issues"]

    if had_successful_request:
        _set_cached_issues(cache_key, [])

    return live_issues


@app.route("/api/projects", methods=["GET"])
def get_projects():
    data = read_data()
    projects = data.get("projects", [])

    query = request.args.get("query", "").strip()
    tag = request.args.get("tag", "").strip()
    difficulty = request.args.get("difficulty", "").strip()
    sort_key = request.args.get("sort", "").strip()

    filtered_projects = _filter_projects(projects, query=query or None, tag=tag or None, difficulty=difficulty or None)
    filtered_projects = _sort_projects(filtered_projects, sort_key)

    return jsonify(filtered_projects)


@app.route("/api/projects", methods=["POST"])
def add_project():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    project, errors = _validate_project_payload(payload)
    if errors:
        return jsonify({"error": "Validation failed.", "fields": errors}), 400

    with DATA_LOCK:
        data = read_data()
        project_id = _get_next_project_id(data)
        project["id"] = project_id

        data.setdefault("projects", []).append(project)
        data["next_project_id"] = project_id + 1
        write_data(data)

    _clear_issue_cache()

    return jsonify({"message": "Project added successfully!", "project": project}), 201


@app.route("/api/issues", methods=["GET"])
def get_issues():
    search_term = request.args.get("query", "").strip()

    try:
        live_issues = _collect_live_issues(search_term)
        return jsonify(live_issues)
    except requests.exceptions.RequestException as error:
        print(f"GitHub API Error: {error}")
        return jsonify({"error": "Could not fetch live issues from GitHub at this time."}), 500


if __name__ == "__main__":
    # Production-friendly defaults: bind to 0.0.0.0 and read port from environment.
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    app.run(host=host, port=port)
