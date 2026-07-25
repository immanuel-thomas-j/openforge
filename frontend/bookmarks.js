document.addEventListener("DOMContentLoaded", () => {
    loadBookmarks();
});

function loadBookmarks() {
    const container = document.getElementById("bookmarks-container");
    if (!container) return;

    const bookmarks = JSON.parse(localStorage.getItem("openforge_bookmarks") || "[]");

    if (!bookmarks.length) {
        container.innerHTML = `
            <div class="status-panel" role="status">
                <strong>No bookmarks added yet.</strong>
                <p>Browse projects and click the bookmark button to save them here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="status-panel" role="status">
            <div class="spinner" aria-hidden="true"></div>
            <strong>Loading bookmarks</strong>
            <p>Fetching your saved projects...</p>
        </div>
    `;

    fetch(`${API_URL}/projects`)
        .then(res => res.json())
        .then(projects => {
            if (!Array.isArray(projects)) throw new Error("Invalid data");
            const saved = projects.filter(p => bookmarks.includes(p.id));
            renderBookmarks(saved);
        })
        .catch(() => {
            container.innerHTML = `
                <div class="status-panel is-error" role="alert">
                    <strong>Unable to load bookmarks</strong>
                    <p>Could not reach the server. Make sure the backend is running.</p>
                </div>
            `;
        });
}

function renderBookmarks(projects) {
    const container = document.getElementById("bookmarks-container");
    if (!container) return;

    container.innerHTML = "";

    if (!projects.length) {
        container.innerHTML = `
            <div class="status-panel" role="status">
                <strong>No bookmarks added yet.</strong>
                <p>Browse projects and click the bookmark button to save them here.</p>
            </div>
        `;
        return;
    }

    projects.forEach(project => {
        const difficulty = project.difficulty || "Medium";

        const article = document.createElement("article");
        article.className = "card";

        const header = document.createElement("div");
        header.className = "card-header";
        const badge = document.createElement("span");
        badge.className = `badge badge-${difficulty.toLowerCase()}`;
        badge.textContent = difficulty;
        header.appendChild(badge);
        article.appendChild(header);

        const title = document.createElement("h3");
        title.textContent = project.name || "Untitled project";
        article.appendChild(title);

        const desc = document.createElement("p");
        desc.textContent = project.description || "No description provided.";
        article.appendChild(desc);

        const tagContainer = document.createElement("div");
        tagContainer.className = "tag-container";
        (project.tags || []).forEach(tag => {
            const span = document.createElement("span");
            span.className = "tag";
            span.textContent = tag;
            tagContainer.appendChild(span);
        });
        article.appendChild(tagContainer);

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const link = document.createElement("a");
        link.className = "btn btn-primary";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.href = project.githubUrl || "#";
        link.textContent = "View on GitHub";
        actions.appendChild(link);

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-bookmark";
        removeBtn.textContent = "\u{274C} Remove Bookmark";
        removeBtn.addEventListener("click", () => {
            removeBookmark(project.id);
        });
        actions.appendChild(removeBtn);

        article.appendChild(actions);
        container.appendChild(article);
    });
}

function removeBookmark(projectId) {
    const bookmarks = JSON.parse(localStorage.getItem("openforge_bookmarks") || "[]");
    const updated = bookmarks.filter(id => id !== projectId);
    localStorage.setItem("openforge_bookmarks", JSON.stringify(updated));
    loadBookmarks();
}
