Resolves #17

This PR adds a Dark Mode toggle to the OpenForge UI for better accessibility and user experience.

### Changes Made:
- Added a `theme-toggle` button inside the main navigation bar on all pages (`index.html`, `explore.html`, `issues.html`, `add.html`).
- Declared a new `[data-theme="dark"]` property within `style.css` which overrides `--bg`, `--surface`, `--text`, and other layout color tokens.
- Modified the `.site-nav` and `body::before` background masks to invert beautifully under the dark theme variables.
- Introduced `setupThemeToggle()` in `app.js` to automatically persist the state using `localStorage` and respect the system-level `prefers-color-scheme` media query on initial load.

@admin Please add the `ECSoC26` label before merging. Based on the ECSoC26 rules for UI enhancements, I request evaluating this work for **Level 2** or **good-ui** bonus labels.
