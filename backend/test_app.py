import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import backend.app as app_module


class OpenForgeApiTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.data_file = Path(self.temp_dir.name) / "data.json"
        self.data_file.write_text(
            json.dumps(
                {
                    "next_project_id": 3,
                    "projects": [
                        {
                            "id": 1,
                            "name": "Alpha",
                            "description": "A beginner project for Python.",
                            "githubUrl": "https://github.com/example/alpha",
                            "tags": ["Python", "Beginner"],
                            "difficulty": "Easy",
                        },
                        {
                            "id": 2,
                            "name": "Beta",
                            "description": "A harder project for React.",
                            "githubUrl": "https://github.com/example/beta",
                            "tags": ["React", "Frontend"],
                            "difficulty": "Hard",
                        },
                    ],
                    "issues": [
                        {
                            "id": 1,
                            "title": "Fix beginner docs",
                            "repoLink": "https://github.com/example/alpha",
                            "issueLink": "https://github.com/example/alpha/issues/1",
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )
        self.patcher = patch.object(app_module, "DATA_FILE", str(self.data_file))
        self.patcher.start()
        app_module._clear_issue_cache()
        app_module.app.config["TESTING"] = True
        self.client = app_module.app.test_client()

    def tearDown(self):
        app_module._clear_issue_cache()
        self.patcher.stop()
        self.temp_dir.cleanup()

    def test_get_projects_returns_projects(self):
        response = self.client.get("/api/projects")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(len(payload), 2)
        self.assertEqual(payload[0]["name"], "Alpha")

    def test_get_projects_supports_filters(self):
        response = self.client.get("/api/projects?query=react&difficulty=Hard")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["name"], "Beta")

    def test_add_project_validates_input(self):
        with self.client.session_transaction() as sess:
            sess["user"] = {"login": "testuser", "avatar_url": "https://example.com/avatar.png", "id": 999}

        response = self.client.post(
            "/api/projects",
            json={
                "name": "",
                "description": "",
                "githubUrl": "not-a-url",
                "tags": "",
                "difficulty": "Impossible",
            },
        )
        self.assertEqual(response.status_code, 400)
        payload = response.get_json()
        self.assertIn("fields", payload)
        self.assertIn("name", payload["fields"])
        self.assertIn("githubUrl", payload["fields"])

    def test_add_project_persists_new_project(self):
        with self.client.session_transaction() as sess:
            sess["user"] = {"login": "testuser", "avatar_url": "https://example.com/avatar.png", "id": 999}

        response = self.client.post(
            "/api/projects",
            json={
                "name": "Gamma",
                "description": "A new project.",
                "githubUrl": "https://github.com/example/gamma",
                "tags": "Python, Tools",
                "difficulty": "Medium",
            },
        )
        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["project"]["id"], 3)
        self.assertEqual(payload["project"]["submittedBy"], "testuser")
        saved = json.loads(self.data_file.read_text(encoding="utf-8"))
        self.assertEqual(saved["next_project_id"], 4)
        self.assertEqual(len(saved["projects"]), 3)

    def test_add_project_returns_401_when_not_logged_in(self):
        response = self.client.post(
            "/api/projects",
            json={
                "name": "Gamma",
                "description": "A new project.",
                "githubUrl": "https://github.com/example/gamma",
                "tags": "Python, Tools",
                "difficulty": "Medium",
            },
        )
        self.assertEqual(response.status_code, 401)
        payload = response.get_json()
        self.assertEqual(payload["error"], "Authentication required. Please sign in with GitHub.")

    def test_add_project_with_session_saves_submitter(self):
        with self.client.session_transaction() as sess:
            sess["user"] = {"login": "testuser", "avatar_url": "https://example.com/avatar.png", "id": 999}

        response = self.client.post(
            "/api/projects",
            json={
                "name": "Gamma",
                "description": "A new project.",
                "githubUrl": "https://github.com/example/gamma",
                "tags": "Python, Tools",
                "difficulty": "Medium",
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["project"]["submittedBy"], "testuser")
        self.assertEqual(payload["project"]["id"], 3)

    @patch.object(app_module.requests, "get")
    def test_get_issues_fetches_live_issues(self, mock_get):
        alpha_response = Mock()
        alpha_response.raise_for_status.return_value = None
        alpha_response.json.return_value = {
            "items": [
                {
                    "id": 123,
                    "title": "Fix beginner docs",
                    "repository_url": "https://api.github.com/repos/example/alpha",
                    "html_url": "https://github.com/example/alpha/issues/1",
                }
            ]
        }
        beta_response = Mock()
        beta_response.raise_for_status.return_value = None
        beta_response.json.return_value = {
            "items": [
                {
                    "id": 456,
                    "title": "Add React examples",
                    "repository_url": "https://api.github.com/repos/example/beta",
                    "html_url": "https://github.com/example/beta/issues/2",
                }
            ]
        }
        mock_get.side_effect = [alpha_response, beta_response]

        response = self.client.get("/api/issues?query=docs")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(len(payload), 2)
        self.assertEqual(payload[0]["title"], "Fix beginner docs")
        self.assertEqual(payload[0]["repoLink"], "https://github.com/example/alpha")
        self.assertEqual(payload[0]["issueLink"], "https://github.com/example/alpha/issues/1")
        self.assertEqual(
            mock_get.call_args_list[0].kwargs["params"]["q"],
            'is:issue is:open label:"good first issue" no:assignee repo:example/alpha docs',
        )
        self.assertEqual(
            mock_get.call_args_list[0].kwargs["headers"],
            {"Accept": "application/vnd.github.v3+json"},
        )
        self.assertEqual(mock_get.call_count, 2)

    @patch.dict("os.environ", {"GITHUB_TOKEN": "ghp_testtoken"}, clear=False)
    @patch.object(app_module.requests, "get")
    def test_get_issues_sends_github_token_when_available(self, mock_get):
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {"items": []}
        mock_get.return_value = mock_response

        response = self.client.get("/api/issues")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            mock_get.call_args.kwargs["headers"],
            {
                "Accept": "application/vnd.github.v3+json",
                "Authorization": "Bearer ghp_testtoken",
            },
        )
        self.assertEqual(mock_get.call_count, 2)

    @patch.object(app_module.requests, "get")
    def test_get_issues_uses_cache_on_repeat_requests(self, mock_get):
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {"items": []}
        mock_get.return_value = mock_response

        first_response = self.client.get("/api/issues")
        second_response = self.client.get("/api/issues")

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(mock_get.call_count, 2)

    @patch.object(app_module.requests, "get")
    def test_get_issues_returns_error_when_github_fails(self, mock_get):
        mock_get.side_effect = app_module.requests.exceptions.RequestException("boom")

        response = self.client.get("/api/issues")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload, [])

    @patch.object(app_module.requests, "get")
    def test_get_issues_falls_back_to_stale_cache(self, mock_get):
        with patch.object(
            app_module,
            "read_data",
            return_value={
                "projects": [
                    {
                        "githubUrl": "https://github.com/example/alpha",
                    }
                ]
            },
        ):
            app_module.ISSUE_CACHE["|example/alpha"] = {
                "issues": [
                    {
                        "id": 1,
                        "title": "Cached issue",
                        "repoLink": "https://github.com/example/alpha",
                        "issueLink": "https://github.com/example/alpha/issues/1",
                    }
                ],
                "expires_at": 0,
            }
            mock_get.side_effect = app_module.requests.exceptions.RequestException("boom")

            response = self.client.get("/api/issues")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["title"], "Cached issue")


if __name__ == "__main__":
    unittest.main()
