# Contributing to OpenForge

Thank you for your interest in contributing to **OpenForge**! We are thrilled to welcome you, especially if you are participating in the **Elite Coders Summer of Code (ECSoC) 2026**. 

This document provides guidelines and instructions to help you get started with contributing. Following these rules ensures a smooth and efficient review process for everyone.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand the community standards we expect all contributors to uphold.

---

## Core Contribution Rules

To ensure high-quality contributions and fair participation, we enforce the following rules:

1. **Issue First:** You must create a new Issue or find an existing one and get assigned **before** opening a Pull Request. Pull Requests opened without an approved and assigned Issue may be closed immediately.
2. **Issue Assignment Priority:** 
   - Only **one contributor** will be assigned per issue.
   - If you create an issue, you have first priority to implement it. Please state in the issue description if you wish to work on it.
   - If an assignee becomes inactive (no updates for 3 consecutive days), the issue may be unassigned and reassigned to another contributor.
3. **Scope of Pull Requests:**
   - **One issue per Pull Request.** Do not bundle multiple unrelated fixes or features into a single PR.
   - Keep Pull Requests small, focused, and incremental. Large, sprawling PRs are difficult to review and are more likely to be rejected or require major changes.
4. **UI Changes:** Any user interface changes must include "Before" and "After" screenshots or a short GIF/video demonstrating the change.
5. **No Blindly Generated Code:** If you use AI tools to generate code, you must review, understand, test, and be able to explain every line of code you submit. Do not submit unreviewed generated code.

---

## Step-by-Step Contribution Workflow

### 1. Find or Create an Issue
Browse the repository [Issues](https://github.com/immanuel-thomas-j/openforge/issues) to find a task you want to work on. 
- If you find an unassigned issue you'd like to work on, leave a comment: `"I would like to work on this issue. Please assign it to me."`
- If you find a bug or have a feature idea that doesn't have an issue, create a new issue using the appropriate template. If you want to work on it, specify: `"I would like to work on this."`
- Wait until a Maintainer assigns the issue to you (you will see your username under "Assignees" and the `assigned` label added) before you start coding.

### 2. Fork the Repository
Click the **Fork** button at the top-right of the OpenForge GitHub repository page to create a copy of the repository in your own GitHub account.

### 3. Clone Your Fork
Clone your fork to your local machine:
```bash
git clone https://github.com/YOUR_USERNAME/openforge.git
cd openforge
```

Add the original repository as an upstream remote to keep your fork up-to-date:
```bash
git remote add upstream https://github.com/immanuel-thomas-j/openforge.git
```

### 4. Create a Branch
Always create a new branch for your work. Do not make changes directly to your `main` branch. 
Use the following branch naming convention:
- For features: `feature/issue-<number>-<short-description>` (e.g., `feature/issue-42-add-search-caching`)
- For bugs: `bugfix/issue-<number>-<short-description>` (e.g., `bugfix/issue-105-fix-cors-origin`)
- For documentation: `docs/issue-<number>-<short-description>` (e.g., `docs/issue-78-update-readme`)

Create and switch to your branch:
```bash
git checkout -b feature/issue-42-add-search-caching
```

### 5. Local Development & Setup
Follow the instructions in the [README.md](README.md#local-development) to set up your local development environment for the Flask backend and static HTML/CSS/JS frontend.

### 6. Coding Standards
Please adhere to the following style guidelines:

#### Backend (Flask)
- Write clean, readable Python code adhering to **PEP 8** guidelines.
- Keep helper functions modular and organize them properly.
- Handle exceptions and errors gracefully. Return appropriate HTTP status codes (e.g., `400 Bad Request`, `404 Not Found`).
- Document your functions and classes with descriptive docstrings.

#### Frontend (HTML/CSS/JS)
- Use **semantic HTML5** elements (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`, etc.).
- Use **Vanilla CSS** for styling. Ensure responsive layout using Flexbox/Grid and media queries.
- Use safe DOM APIs to prevent cross-site scripting (XSS) vulnerabilities. **Never** use `innerHTML` with unsanitized user-supplied input; use `textContent` or `innerText` instead.
- Avoid introducing external frontend frameworks or heavy libraries unless explicitly approved in the issue.

### 7. Run Tests and Verify
Before committing, you must verify your changes:
- **Backend:** Run the unit tests to make sure everything passes:
  ```bash
  python -m unittest backend.test_app -v
  ```
- **Frontend:** Open the browser developer console (F12) and verify there are no JavaScript errors or warnings.
- **Responsiveness:** Test your changes across desktop, tablet, and mobile viewport sizes.

### 8. Commit Your Changes
We use a semantic commit message convention. Write clear, descriptive commit messages:
```
<type>(<scope>): <description>

[Optional body explaining details]
```

**Allowed Types:**
- `feat`: A new feature (e.g., `feat(ui): add filter by difficulty`)
- `fix`: A bug fix (e.g., `fix(api): prevent cache key collision`)
- `docs`: Documentation changes (e.g., `docs(readme): correct setup command`)
- `style`: Code style updates (formatting, missing semicolons, etc.; no production code change)
- `refactor`: A code change that neither fixes a bug nor adds a feature (e.g., `refactor(backend): clean up cache logic`)
- `test`: Adding missing tests or correcting existing tests (e.g., `test(backend): add coverage for project registration`)

**Example Commit:**
```bash
git commit -m "feat(api): add route for active ECSoC issues filtering"
```

### 9. Keep Your Branch Sync'd
Before submitting a PR, make sure your branch is up-to-date with the upstream `main` branch:
```bash
git checkout main
git pull upstream main
git checkout your-branch-name
git rebase main
```
Resolve any merge conflicts that may arise and test again.

### 10. Push & Open a Pull Request
Push your branch to your origin:
```bash
git push origin your-branch-name
```
Navigate to the original OpenForge repository on GitHub. You will see a prompt to open a Pull Request.
- Select the `PULL_REQUEST_TEMPLATE.md` if it doesn't load automatically.
- Fill out the template thoroughly.
- Link your approved issue in the description using GitHub keywords (e.g., `Closes #42`).
- Attach screenshots or recordings if you modified any UI.

---

## Review and Merge Process

1. **Initial Review:** A Maintainer will review your Pull Request. They may request changes, ask questions, or approve the PR.
2. **Addressing Feedback:** If changes are requested, apply them locally, commit them, and push them to your branch. The PR will automatically update.
3. **Approval & Labeling:** Once approved, the Maintainer will apply the `ECSoC26` label (and potentially other difficulty/status labels) and merge your Pull Request into `main`.
4. **Squash Merging:** Maintainers will squash-merge your PR to keep a clean commit history on the main branch.

If you have any questions or need help, feel free to ask in the comment section of your assigned issue. Thank you for making OpenForge better!
