const API_URL = "http://127.0.0.1:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupProjectPage();
    setupIssuePage();
    setupAddProjectForm();
    setupHeroSearch();
});

function setupNavigation() {
    const nav = document.querySelector(".site-nav");
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");

    if (!nav || !toggle || !links) {
        return;
    }

    const closeMenu = () => {
        nav.classList.remove("nav-open");
        links.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("nav-open");
        links.classList.toggle("active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    links.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        if (!nav.contains(event.target)) {
            closeMenu();
        }
    });
}

function setupHeroSearch() {
    const search = document.getElementById("hero-search");

    if (!search) {
        return;
    }

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

    if (!container) {
        return;
    }

    const search = document.getElementById("project-search");
    const tagFilter = document.getElementById("tag-filter");
    const difficultyFilter = document.getElementById("difficulty-filter");
    const sortFilter = document.getElementById("sort-filter");
    const resetButton = document.getElementById("reset-project-filters");

    const triggerFetch = () => fetchProjects();
    let debounceTimer;

    if (search) {
        search.addEventListener("input", () => {
            window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(triggerFetch, 180);
        });
    }

    [tagFilter, difficultyFilter, sortFilter].forEach((element) => {
        if (element) {
            element.addEventListener("change", triggerFetch);
        }
    });

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            if (search) search.value = "";
            if (tagFilter) tagFilter.value = "";
            if (difficultyFilter) difficultyFilter.value = "";
            if (sortFilter) sortFilter.value = "";
            fetchProjects();
        });
    }

    loadProjectFilters().then(() => {
        const params = new URLSearchParams(window.location.search);
        if (search && params.get("query")) {
            search.value = params.get("query");
        }
        fetchProjects();
    });
}

function setupIssuePage() {
    const container = document.getElementById("issues-container");

    if (!container) {
        return;
    }

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

    if (!form) {
        return;
    }

    form.addEventListener("submit", submitProject);
}

function getProjectFilters() {
    return {
        query: document.getElementById("project-search")?.value.trim() || "",
        tag: document.getElementById("tag-filter")?.value || "",
        difficulty: document.getElementById("difficulty-filter")?.value || "",
        sort: document.getElementById("sort-filter")?.value || "",
    };
}

function setMessage(elementId, text, type) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = text;
    element.classList.remove("is-success", "is-error");

    if (type === "success") {
        element.classList.add("is-success");
    } else if (type === "error") {
        element.classList.add("is-error");
    }
}

function renderStatusPanel(container, { title, message, variant = "", loading = false }) {
    if (!container) {
        return;
    }

    setContainerBusy(container, loading);
    const panel = document.createElement("div");
    panel.className = `status-panel${variant ? ` ${variant}` : ""}`;
    panel.setAttribute("role", variant === "is-error" ? "alert" : "status");

    if (loading) {
        const spinner = document.createElement("div");
        spinner.className = "spinner";
        spinner.setAttribute("aria-hidden", "true");
        panel.appendChild(spinner);
    }

    if (title) {
        const heading = document.createElement("strong");
        heading.textContent = title;
        panel.appendChild(heading);
    }

    if (message) {
        const copy = document.createElement("p");
        copy.textContent = message;
        panel.appendChild(copy);
    }

    container.innerHTML = "";
    container.appendChild(panel);
}

function setContainerBusy(container, isBusy) {
    if (container) {
        container.setAttribute("aria-busy", String(isBusy));
    }
}

function renderProjects(projects) {
    const container = document.getElementById("projects-container");

    if (!container) {
        return;
    }

    setContainerBusy(container, false);
    container.innerHTML = "";

    if (!projects.length) {
        renderStatusPanel(container, {
            title: "No projects found",
            message: "Try adjusting your search or filters to discover more repositories.",
        });
        return;
    }

    projects.forEach((project) => {
        container.appendChild(makeProjectCard(project));
    });
}

function renderIssues(issues) {
    const container = document.getElementById("issues-container");

    if (!container) {
        return;
    }

    setContainerBusy(container, false);
    container.innerHTML = "";

    issues.forEach((issue) => {
        container.appendChild(makeIssueCard(issue));
    });
}

function populateTagFilter(projects) {
    const tagFilter = document.getElementById("tag-filter");

    if (!tagFilter) {
        return;
    }

    const tags = new Set();
    projects.forEach((project) => {
        (project.tags || []).forEach((tag) => tags.add(tag));
    });

    const selectedValue = tagFilter.value;
    tagFilter.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "All technologies";
    tagFilter.appendChild(defaultOption);

    Array.from(tags).sort((a, b) => a.localeCompare(b)).forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });

    tagFilter.value = selectedValue;
}

async function loadProjectFilters() {
    const tagFilter = document.getElementById("tag-filter");

    if (!tagFilter) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/projects`);
        const projects = await response.json();

        if (!response.ok) {
            throw new Error(projects.error || "Error loading filters");
        }

        if (!Array.isArray(projects)) {
            throw new Error("Invalid project data received");
        }

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

    try {
        const filters = getProjectFilters();
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });

        const url = params.toString() ? `${API_URL}/projects?${params.toString()}` : `${API_URL}/projects`;
        const response = await fetch(url);
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || "Failed to load projects");
        }

        if (!Array.isArray(payload)) {
            throw new Error("Invalid project data received");
        }

        renderProjects(payload);
    } catch (error) {
        console.error("Error fetching projects:", error);
        renderStatusPanel(container, {
            title: "Unable to load projects",
            message: "Make sure the Flask backend is running on http://127.0.0.1:5000.",
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

    try {
        const params = new URLSearchParams();

        if (search) {
            params.set("query", search);
        }

        const url = params.toString() ? `${API_URL}/issues?${params.toString()}` : `${API_URL}/issues`;
        const response = await fetch(url);
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.error || "Failed to load issues");
        }

        if (!Array.isArray(payload) || !payload.length) {
            renderStatusPanel(container, {
                title: search ? "No matching issues" : "No issues available",
                message: search
                    ? "Try a different search term or clear the filter."
                    : "Check back later or submit a project with open good-first issues.",
            });
            return;
        }

        renderIssues(payload);
    } catch (error) {
        console.error("Error fetching issues:", error);
        renderStatusPanel(container, {
            title: "Unable to load issues",
            message: "GitHub may be unavailable or the rate limit was exceeded. Try again shortly.",
            variant: "is-error",
        });
    }
}

function makeProjectCard(project) {
    const card = document.createElement("article");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const difficultyLevel = project.difficulty || "Medium";
    const difficulty = document.createElement("span");
    difficulty.className = `badge badge-${difficultyLevel.toLowerCase()}`;
    difficulty.textContent = difficultyLevel;
    header.appendChild(difficulty);
    card.appendChild(header);

    const title = document.createElement("h3");
    title.textContent = project.name || "Untitled project";
    card.appendChild(title);

    const description = document.createElement("p");
    description.textContent = project.description || "No description provided.";
    card.appendChild(description);

    const tags = document.createElement("div");
    tags.className = "tag-container";
    (project.tags || []).forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "tag";
        chip.textContent = tag;
        tags.appendChild(chip);
    });
    card.appendChild(tags);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const link = document.createElement("a");
    link.href = project.githubUrl || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "btn btn-primary";
    link.textContent = "View on GitHub";
    actions.appendChild(link);
    card.appendChild(actions);

    return card;
}

function formatRepoLabel(repoLink) {
    if (!repoLink) {
        return "View repository";
    }

    try {
        const parts = new URL(repoLink).pathname.split("/").filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0]}/${parts[1]}`;
        }
    } catch (error) {
        return "View repository";
    }

    return "View repository";
}

function makeIssueCard(issue) {
    const card = document.createElement("article");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const badge = document.createElement("span");
    badge.className = "badge badge-easy";
    badge.textContent = "Good First Issue";
    header.appendChild(badge);
    card.appendChild(header);

    const title = document.createElement("h3");
    title.textContent = issue.title || "Untitled issue";
    card.appendChild(title);

    const repoParagraph = document.createElement("p");
    repoParagraph.append("Repository: ");

    const repoLink = document.createElement("a");
    repoLink.href = issue.repoLink || "#";
    repoLink.target = "_blank";
    repoLink.rel = "noopener noreferrer";
    repoLink.className = "card-link";
    repoLink.textContent = formatRepoLabel(issue.repoLink);
    repoParagraph.appendChild(repoLink);
    card.appendChild(repoParagraph);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const issueLink = document.createElement("a");
    issueLink.href = issue.issueLink || "#";
    issueLink.target = "_blank";
    issueLink.rel = "noopener noreferrer";
    issueLink.className = "btn btn-primary";
    issueLink.textContent = "Go to Issue";
    actions.appendChild(issueLink);
    card.appendChild(actions);

    return card;
}

async function submitProject(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    const messageId = "form-message";

    setMessage(messageId, "Submitting project...", "");
    if (submitButton) {
        submitButton.disabled = true;
    }

    const tagsInput = document.getElementById("tags").value;
    const projectData = {
        name: document.getElementById("name").value.trim(),
        description: document.getElementById("description").value.trim(),
        githubUrl: document.getElementById("githubUrl").value.trim(),
        tags: tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
        difficulty: document.getElementById("difficulty").value,
    };

    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(projectData),
        });

        const payload = await response.json();

        if (!response.ok) {
            const fieldErrors = payload.fields
                ? Object.values(payload.fields).join(" ")
                : payload.error || "Failed to add project.";
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
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}
