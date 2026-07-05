// Allow overriding the API URL from the page (useful when frontend is hosted separately)
const API_URL = window.OPENFORGE_API_URL || "http://127.0.0.1:5000/api";
// BASE_URL (without /api suffix) for auth endpoints (/auth/login, /auth/logout, /auth/me)
const BASE_URL = window.OPENFORGE_API_URL
    ? window.OPENFORGE_API_URL.replace(/\/api\/?$/, "")
    : "http://127.0.0.1:5000";
let currentUser = null;

// Global State for Issue Pagination
let allIssues = [];
let currentIssuePage = 1;
const ISSUES_PER_PAGE = 12;

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupAuth();
    setupProjectPage();
    setupIssuePage();
    setupAddProjectForm();
    setupHeroSearch();
    // initialize custom dropdowns globally for pages with selects marked `filter-control`
    if (typeof setupCustomDropdowns === 'function') setupCustomDropdowns();
});

function getFetchOptions({ method = 'GET', headers = {}, body = null } = {}) {
    const options = {
        method,
        credentials: 'include',
        headers: {
            ...headers,
        },
    };

    if (body !== null) {
        options.body = body;
    }

    return options;
}

async function setupAuth() {
    await loadAuthState();
    updateAddPageForAuth();
}

async function loadAuthState() {
    const authContainer = document.getElementById("auth-nav-container");
    if (!authContainer) return;

    try {
        const response = await fetch(`${BASE_URL}/auth/me`, getFetchOptions());
        const payload = await response.json();

        if (response.ok && payload && payload.login) {
            currentUser = payload;
        } else {
            currentUser = null;
        }
    } catch (error) {
        console.error("Error fetching auth state:", error);
        currentUser = null;
    }

    renderAuthNav(currentUser);
}

function renderAuthNav(user) {
    const authContainer = document.getElementById("auth-nav-container");
    if (!authContainer) return;

    if (user) {
        authContainer.innerHTML = `
            <div class="auth-menu">
                <button type="button" class="auth-button auth-user" aria-haspopup="true" aria-expanded="false">
                    <img src="${user.avatar_url || ''}" alt="${user.login || 'GitHub user'} avatar" class="auth-avatar" />
                    <span>${user.login}</span>
                </button>
                <button type="button" id="logout-button" class="btn btn-ghost">Logout</button>
            </div>
        `;

        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
            logoutButton.addEventListener("click", handleLogout);
        }
    } else {
        authContainer.innerHTML = `
            <div class="auth-menu">
                <button type="button" id="github-login-button" class="btn btn-primary btn-small">Sign in with GitHub</button>
            </div>
        `;

        const loginButton = document.getElementById("github-login-button");
        if (loginButton) {
            loginButton.addEventListener("click", () => {
                window.location.href = `${BASE_URL}/auth/login`;
            });
        }
    }
}

async function handleLogout() {
    try {
        const response = await fetch(`${BASE_URL}/auth/logout`, getFetchOptions({ method: 'POST' }));
        if (response.ok) {
            currentUser = null;
            renderAuthNav(null);
            updateAddPageForAuth();
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
}

function updateAddPageForAuth() {
    const authMessageContainer = document.getElementById("add-auth-message");
    const form = document.getElementById("add-project-form");
    const submitButton = form?.querySelector('button[type="submit"]');

    if (!authMessageContainer || !form || !submitButton) return;

    if (currentUser) {
        authMessageContainer.innerHTML = `
            <div class="auth-success">
                Signed in as <strong>${currentUser.login}</strong>. You can now submit a project.
            </div>
        `;
        submitButton.disabled = false;
        form.classList.remove("disabled");
    } else {
        authMessageContainer.innerHTML = `
            <div class="auth-warning">
                <p>Please sign in with GitHub before submitting a project.</p>
                <button type="button" class="btn btn-primary btn-small" id="add-github-login">Sign in with GitHub</button>
            </div>
        `;
        submitButton.disabled = true;
        form.classList.add("disabled");

        const addLoginButton = document.getElementById("add-github-login");
        if (addLoginButton) {
            addLoginButton.addEventListener("click", () => {
                window.location.href = `${BASE_URL}/auth/login`;
            });
        }
    }
}

function setupNavigation() {
    const nav = document.querySelector(".site-nav");
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");

    if (!nav || !toggle || !links) return;

    // expose nav height to CSS (used by mobile panel max-height calculation)
    const setNavHeightVar = () => {
        const h = nav.offsetHeight || 56;
        nav.style.setProperty('--site-nav-height', `${h}px`);
    };
    setNavHeightVar();
    // debounce resize updates
    let navResizeTimer = null;
    window.addEventListener('resize', () => {
        if (navResizeTimer) clearTimeout(navResizeTimer);
        navResizeTimer = setTimeout(setNavHeightVar, 120);
    });

    let navBackdrop = null;

    const createBackdrop = () => {
        if (navBackdrop) return;
        navBackdrop = document.createElement('div');
        navBackdrop.className = 'nav-backdrop';
        navBackdrop.tabIndex = -1;
        document.body.appendChild(navBackdrop);
        navBackdrop.addEventListener('click', closeMenu);
    };

    const removeBackdrop = () => {
        if (!navBackdrop) return;
        navBackdrop.removeEventListener('click', closeMenu);
        document.body.removeChild(navBackdrop);
        navBackdrop = null;
    };

    const closeMenu = () => {
        nav.classList.remove("nav-open");
        links.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove('nav-open');
        removeBackdrop();
    };

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("nav-open");
        links.classList.toggle("active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        // prevent background scroll when mobile nav is open
        document.body.classList.toggle('nav-open', isOpen);
        if (isOpen) createBackdrop(); else removeBackdrop();
    });

    links.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

    document.addEventListener("click", (event) => {
        // only close if menu is open and click occurred outside the nav
        if (nav.classList.contains('nav-open') && !nav.contains(event.target)) {
            closeMenu();
        }
    });

    // Close mobile nav on Escape for better keyboard UX
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });
}

function setupHeroSearch() {
    const search = document.getElementById("hero-search");
    if (!search) return;

    const goToExplore = () => {
        const query = search.value.trim();
        const url = query ? `explore.html?query=${encodeURIComponent(query)}` : "explore.html";
        window.location.href = url;
    };

    search.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            goToExplore();
        }
    });

    const searchBtn = document.querySelector(".btn-search");
    if (searchBtn) {
        searchBtn.addEventListener("click", goToExplore);
    }
}

function setupProjectPage() {
    const container = document.getElementById("projects-container");
    if (!container) return;

    const search = document.getElementById("project-search");
    const tagFilter = document.getElementById("tag-filter");
    const difficultyFilter = document.getElementById("difficulty-filter");
    const sortFilter = document.getElementById("sort-filter");
    const resetButton = document.getElementById("reset-project-filters");

    const triggerFetch = () => {
  updateActiveFiltersSummary();
  fetchProjects();
};
    let debounceTimer;

    if (search) {
        search.addEventListener("input", () => {
            window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(triggerFetch, 180);
        });
    }

    [tagFilter, difficultyFilter, sortFilter].forEach((element) => {
        if (element) element.addEventListener("change", triggerFetch);
    });

    if (resetButton) {
  resetButton.addEventListener("click", () => {
    if (search) search.value = "";
    if (tagFilter) tagFilter.value = "";
    if (difficultyFilter) difficultyFilter.value = "";
    if (sortFilter) sortFilter.value = "";

    updateActiveFiltersSummary();

    if (typeof setupCustomDropdowns === "function") {
      setupCustomDropdowns();
    }

    fetchProjects();
  });
}

    loadProjectFilters().then(() => {
  const params = new URLSearchParams(window.location.search);
  if (search && params.get("query")) {
    search.value = params.get("query");
  }

  updateActiveFiltersSummary();
  fetchProjects();
});
}

function setupIssuePage() {
    const container = document.getElementById("issues-container");
    if (!container) return;

    const search = document.getElementById("issue-search");
    const resetButton = document.getElementById("reset-issue-filters");
    const refreshButton = document.getElementById("refresh-issues");
    let debounceTimer;

    if (search) {
        search.addEventListener("input", () => {
            window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(fetchIssues, 180);
        });
    }

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            if (search) search.value = "";
            fetchIssues();
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", fetchIssues);
    }

    fetchIssues();
}

function setupAddProjectForm() {
    const form = document.getElementById("add-project-form");
    if (form) form.addEventListener("submit", submitProject);
}

function getProjectFilters() {
    return {
        query: document.getElementById("project-search")?.value.trim() || "",
        tag: document.getElementById("tag-filter")?.value || "",
        difficulty: document.getElementById("difficulty-filter")?.value || "",
        sort: document.getElementById("sort-filter")?.value || "",
    };
}

function updateActiveFiltersSummary() {
  const summaryContainer = document.getElementById("active-filters-list");
  if (!summaryContainer) return;

  const filters = getProjectFilters();
  const activeFilters = [];

  if (filters.query) {
    activeFilters.push({
      label: "Search",
      value: filters.query,
    });
  }

  if (filters.tag) {
    activeFilters.push({
      label: "Technology",
      value: filters.tag,
    });
  }

  if (filters.difficulty) {
    activeFilters.push({
      label: "Difficulty",
      value: filters.difficulty,
    });
  }

  if (filters.sort) {
    const sortLabels = {
      name: "Name (A-Z)",
      difficulty: "Difficulty",
      oldest: "Oldest",
    };

    activeFilters.push({
      label: "Sort",
      value: sortLabels[filters.sort] || filters.sort,
    });
  }

  summaryContainer.innerHTML = "";

  if (!activeFilters.length) {
    const emptyChip = document.createElement("span");
    emptyChip.className = "filter-chip";
    emptyChip.textContent = "None";
    summaryContainer.appendChild(emptyChip);
    return;
  }

  activeFilters.forEach((filter) => {
    const chip = document.createElement("span");
    chip.className = "filter-chip";
    chip.textContent = `${filter.label}: ${filter.value}`;
    summaryContainer.appendChild(chip);
  });
}

function setMessage(elementId, text, type) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = text;
    element.classList.remove("is-success", "is-error");

    if (type === "success") element.classList.add("is-success");
    else if (type === "error") element.classList.add("is-error");
}

function renderStatusPanel(container, { title, message, variant = "", loading = false }) {
    if (!container) return;

    setContainerBusy(container, loading);
    
    let content = '';
    if (loading) content += `<div class="spinner" aria-hidden="true"></div>`;
    if (title) content += `<strong>${title}</strong>`;
    if (message) content += `<p>${message}</p>`;

    container.innerHTML = `
        <div class="status-panel ${variant}" role="${variant === 'is-error' ? 'alert' : 'status'}">
            ${content}
        </div>
    `;
}

function setContainerBusy(container, isBusy) {
    if (container) container.setAttribute("aria-busy", String(isBusy));
}

// ============================================================
// MODERNIZED TEMPLATE RENDERERS
// ============================================================

function renderProjects(projects) {
    const container = document.getElementById("projects-container");
    if (!container) return;

    setContainerBusy(container, false);
    container.innerHTML = '';

    if (!projects.length) {
        renderStatusPanel(container, {
            title: "No projects found",
            message: "Try adjusting your search or filters to discover more repositories.",
        });
        return;
    }

    projects.forEach(project => {
        const difficulty = project.difficulty || "Medium";

        const article = document.createElement('article');
        article.className = 'card';

        const header = document.createElement('div');
        header.className = 'card-header';
        const badge = document.createElement('span');
        badge.className = `badge badge-${difficulty.toLowerCase()}`;
        badge.textContent = difficulty;
        header.appendChild(badge);
        article.appendChild(header);

        const title = document.createElement('h3');
        title.textContent = project.name || 'Untitled project';
        article.appendChild(title);

        const desc = document.createElement('p');
        desc.textContent = project.description || 'No description provided.';
        article.appendChild(desc);

        const tagContainer = document.createElement('div');
        tagContainer.className = 'tag-container';
        (project.tags || []).forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            tagContainer.appendChild(span);
        });
        article.appendChild(tagContainer);

        const actions = document.createElement('div');
        actions.className = 'card-actions';
        const link = document.createElement('a');
        link.className = 'btn btn-primary';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.href = project.githubUrl || '#';
        link.textContent = 'View on GitHub';
        actions.appendChild(link);
        article.appendChild(actions);

        container.appendChild(article);
    });
}

function renderIssues(issues, replace = true) {
    const container = document.getElementById("issues-container");
    if (!container) return;

    setContainerBusy(container, false);
    if (replace) {
        container.innerHTML = '';
    }

    issues.forEach(issue => {
        const article = document.createElement('article');
        article.className = 'card';

        const header = document.createElement('div');
        header.className = 'card-header';
        const badge = document.createElement('span');
        badge.className = 'badge badge-easy';
        badge.textContent = 'Good First Issue';
        header.appendChild(badge);
        article.appendChild(header);

        const title = document.createElement('h3');
        title.textContent = issue.title || 'Untitled issue';
        article.appendChild(title);

        const repoPara = document.createElement('p');
        repoPara.textContent = 'Repository: ';
        const repoLink = document.createElement('a');
        repoLink.href = issue.repoLink || '#';
        repoLink.target = '_blank';
        repoLink.rel = 'noopener noreferrer';
        repoLink.className = 'card-link';
        repoLink.textContent = formatRepoLabel(issue.repoLink);
        repoPara.appendChild(repoLink);
        article.appendChild(repoPara);

        const actions = document.createElement('div');
        actions.className = 'card-actions';
        const issueAnchor = document.createElement('a');
        issueAnchor.href = issue.issueLink || '#';
        issueAnchor.target = '_blank';
        issueAnchor.rel = 'noopener noreferrer';
        issueAnchor.className = 'btn btn-primary';
        issueAnchor.textContent = 'Go to Issue';
        actions.appendChild(issueAnchor);
        article.appendChild(actions);

        container.appendChild(article);
    });
}

function renderLoadMoreButton() {
    const container = document.getElementById("issues-container");
    if (!container) return;

    // Remove existing if any
    const existingBtn = document.getElementById("load-more-btn-container");
    if (existingBtn) existingBtn.remove();

    const endIdx = currentIssuePage * ISSUES_PER_PAGE;
    if (endIdx < allIssues.length) {
        const btnContainer = document.createElement("div");
        btnContainer.className = "load-more-container";
        btnContainer.id = "load-more-btn-container";
        
        const btn = document.createElement("button");
        btn.className = "btn btn-primary load-more-btn";
        btn.textContent = "Load More Issues";
        btn.addEventListener("click", loadMoreIssues);
        
        btnContainer.appendChild(btn);
        container.parentNode.insertBefore(btnContainer, container.nextSibling);
    }
}

function loadMoreIssues() {
    currentIssuePage++;
    const startIdx = (currentIssuePage - 1) * ISSUES_PER_PAGE;
    const endIdx = currentIssuePage * ISSUES_PER_PAGE;
    const nextIssues = allIssues.slice(startIdx, endIdx);
    
    renderIssues(nextIssues, false);
    renderLoadMoreButton();
}

function populateTagFilter(projects) {
    const tagFilter = document.getElementById("tag-filter");
    if (!tagFilter) return;

    const tags = new Set();
    projects.forEach((project) => {
        (project.tags || []).forEach((tag) => tags.add(tag));
    });

    const selectedValue = tagFilter.value;

    tagFilter.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All technologies';
    tagFilter.appendChild(defaultOption);

    Array.from(tags).sort((a, b) => a.localeCompare(b)).forEach((tag) => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });

    tagFilter.value = selectedValue;
    // initialize custom dropdowns after the native select is populated
    if (typeof setupCustomDropdowns === 'function') {
        setupCustomDropdowns();
    }
}

// ============================================================
// CUSTOM DROPDOWN UI ENGINE
// ============================================================

function setupCustomDropdowns() {
    const selects = document.querySelectorAll('select.filter-control');

    selects.forEach(select => {
        // If a custom UI already exists, remove it (refresh)
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select')) {
            select.nextElementSibling.remove();
        }

        // Hide the native select
        select.style.display = 'none';

        // Build custom select container
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        const selectedOpt = select.options[select.selectedIndex];
        trigger.innerHTML = `
            <span>${selectedOpt ? selectedOpt.text : 'Select...'}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';

        Array.from(select.options).forEach(option => {
            const optEl = document.createElement('div');
            optEl.className = 'custom-option' + (option.selected ? ' selected' : '');
            optEl.textContent = option.text;
            optEl.dataset.value = option.value;

            optEl.addEventListener('click', function(e) {
                e.stopPropagation();
                select.value = this.dataset.value;
                trigger.querySelector('span').textContent = this.textContent;
                optionsContainer.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
                this.classList.add('selected');
                customSelect.classList.remove('open');
                select.dispatchEvent(new Event('change'));
            });

            optionsContainer.appendChild(optEl);
        });

        customSelect.appendChild(trigger);
        customSelect.appendChild(optionsContainer);
        select.parentNode.insertBefore(customSelect, select.nextSibling);

        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.custom-select').forEach(cs => {
                if (cs !== customSelect) cs.classList.remove('open');
            });
            customSelect.classList.toggle('open');
        });
    });

    document.addEventListener('click', function() {
        document.querySelectorAll('.custom-select').forEach(cs => cs.classList.remove('open'));
    });
}

function formatRepoLabel(repoLink) {
    if (!repoLink) return "View repository";
    try {
        const parts = new URL(repoLink).pathname.split("/").filter(Boolean);
        if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    } catch (error) {
        return "View repository";
    }
    return "View repository";
}

// ============================================================
// API CALLS
// ============================================================

async function loadProjectFilters() {
    const tagFilter = document.getElementById("tag-filter");
    if (!tagFilter) return;

    try {
        const response = await fetch(`${API_URL}/projects`, getFetchOptions());
        const projects = await response.json();

        if (!response.ok) throw new Error(projects.error || "Error loading filters");
        if (!Array.isArray(projects)) throw new Error("Invalid project data received");

        populateTagFilter(projects);
    } catch (error) {
        console.error("Error loading project filters:", error);
    }
}

async function fetchProjects() {
    const container = document.getElementById("projects-container");

    renderStatusPanel(container, {
        title: "Loading projects",
        message: "Fetching curated repositories from OpenForge...",
        loading: true,
    });

    let wakingUpTimer = null;

    try {
        const filters = getProjectFilters();
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });

        const url = params.toString() ? `${API_URL}/projects?${params.toString()}` : `${API_URL}/projects`;
        
        // Start a timer to show "waking up" message if fetch takes >3s
        const fetchPromise = fetch(url, getFetchOptions());
        const wakingUpPromise = new Promise(resolve => {
            wakingUpTimer = window.setTimeout(() => {
                renderStatusPanel(container, {
                    title: "Backend is waking up...",
                    message: "Render free tier backend is starting. This may take 30 seconds on first load.",
                    loading: true,
                });
                resolve(null);
            }, 3000);
        });

        const response = await Promise.race([
            fetchPromise,
            wakingUpPromise.then(() => fetchPromise)
        ]);

        window.clearTimeout(wakingUpTimer);
        
        const payload = await response.json();

        if (!response.ok) {
            const errorMsg = payload.error || "Failed to load projects";
            throw new Error(`${response.status}: ${errorMsg}`);
        }
        if (!Array.isArray(payload)) throw new Error("Invalid project data received");

        renderProjects(payload);
    } catch (error) {
        console.error("Error fetching projects:", error);
        let errorTitle = "Unable to load projects";
        let errorMessage = "Make sure the Flask backend is running on https://openforge-48r0.onrender.com.";
        
        // Check if error message contains 403 status
        if (error.message && error.message.includes("403")) {
            errorTitle = "Rate limit exceeded";
            errorMessage = "GitHub API rate limit reached. Please try again in a few minutes.";
        }
        
        renderStatusPanel(container, {
            title: errorTitle,
            message: errorMessage,
            variant: "is-error",
        });
    }
}

async function fetchIssues() {
    const container = document.getElementById("issues-container");
    const search = document.getElementById("issue-search")?.value.trim() || "";

    renderStatusPanel(container, {
        title: "Loading issues",
        message: "Pulling beginner-friendly issues from submitted repositories...",
        loading: true,
    });

    let wakingUpTimer = null;

    try {
        const params = new URLSearchParams();
        if (search) params.set("query", search);

        const url = params.toString() ? `${API_URL}/issues?${params.toString()}` : `${API_URL}/issues`;
        
        // Start a timer to show "waking up" message if fetch takes >3s
        const fetchPromise = fetch(url, getFetchOptions());
        const wakingUpPromise = new Promise(resolve => {
            wakingUpTimer = window.setTimeout(() => {
                renderStatusPanel(container, {
                    title: "Backend is waking up...",
                    message: "Render free tier backend is starting. This may take 30 seconds on first load.",
                    loading: true,
                });
                resolve(null);
            }, 3000);
        });

        const response = await Promise.race([
            fetchPromise,
            wakingUpPromise.then(() => fetchPromise)
        ]);

        window.clearTimeout(wakingUpTimer);
        
        const payload = await response.json();

        if (!response.ok) {
            const errorMsg = payload.error || "Failed to load issues";
            throw new Error(`${response.status}: ${errorMsg}`);
        }
        if (!Array.isArray(payload) || !payload.length) {
            renderStatusPanel(container, {
                title: search ? "No matching issues" : "No issues available",
                message: search
                    ? "Try a different search term or clear the filter."
                    : "Check back later or submit a project with open good-first issues.",
            });
            // Also remove load more button if present
            const existingBtn = document.getElementById("load-more-btn-container");
            if (existingBtn) existingBtn.remove();
            return;
        }

        allIssues = payload;
        currentIssuePage = 1;
        
        const firstPage = allIssues.slice(0, ISSUES_PER_PAGE);
        renderIssues(firstPage, true);
        renderLoadMoreButton();
    } catch (error) {
        console.error("Error fetching issues:", error);
        let errorTitle = "Unable to load issues";
        let errorMessage = "GitHub may be unavailable or the rate limit was exceeded. Try again shortly.";
        
        // Check if error message contains 403 status (rate limit)
        if (error.message && error.message.includes("403")) {
            errorTitle = "Rate limit exceeded";
            errorMessage = "GitHub API rate limit reached. Please try again in a few minutes.";
        }
        
        renderStatusPanel(container, {
            title: errorTitle,
            message: errorMessage,
            variant: "is-error",
        });
    }
}

async function submitProject(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const messageId = "form-message";

    // Clear any previous field error states
    form.querySelectorAll('.is-error').forEach((el) => el.classList.remove('is-error'));
    form.querySelectorAll('.field-error').forEach((el) => el.remove());

    setMessage(messageId, "Submitting project...", "");
    if (submitButton) submitButton.disabled = true;

    const tagsInput = document.getElementById("tags").value;
    const projectData = {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        githubUrl: document.getElementById("githubUrl").value.trim(),
        tags: tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
        difficulty: document.getElementById("difficulty").value,
    };

    try {
        const response = await fetch(`${API_URL}/projects`, getFetchOptions({
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(projectData),
        }));

        const payload = await response.json();

        if (!response.ok) {
            // If the server returned field-level validation errors, show them inline using template string injection
            if (payload.fields && typeof payload.fields === 'object') {
                Object.keys(payload.fields).forEach((fieldName) => {
                    const input = document.getElementById(fieldName);
                    if (input) {
                        input.classList.add('is-error');
                        input.insertAdjacentHTML('afterend', `<div class="field-error">${payload.fields[fieldName]}</div>`);
                    }
                });
                setMessage(messageId, 'Please fix the highlighted fields.', 'error');
                return;
            }

            const fieldErrors = payload.error || "Failed to add project.";
            setMessage(messageId, fieldErrors, "error");
            return;
        }

        setMessage(messageId, "Project added successfully! Redirecting...", "success");
        form.reset();
        window.setTimeout(() => {
            window.location.href = "explore.html";
        }, 1200);
    } catch (error) {
        console.error("Error submitting project:", error);
        setMessage(messageId, "Could not reach the server. Is the backend running?", "error");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}