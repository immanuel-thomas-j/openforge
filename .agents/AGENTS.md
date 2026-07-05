# Open Source Contribution Rules

Whenever you (the AI Agent) are about to contribute to any repository (e.g., creating an issue, submitting a PR, or commenting), you MUST strictly follow these rules:

1. **Check for Pinned Notices:** Always check the repository's pinned issues or notices first. Maintainers often put strict limits (e.g., "max 2 issues per person") or specific instructions (e.g., "suggest features in comments first") there.
2. **Use Issue Templates:** Before creating a new issue, ALWAYS check if a `.github/ISSUE_TEMPLATE` folder exists. If templates are provided, your issue description MUST strictly follow the format of the appropriate template.
3. **Read Contribution Guidelines:** Scan for `CONTRIBUTING.md`, `README.md`, or `docs/contributing` to understand the project's specific workflow and rules before taking any action.
4. **Check for Duplicates:** Always search the existing open and closed issues to ensure the bug or feature hasn't already been reported or resolved.
5. **Avoid Spamming:** Do not open multiple issues at once in the same repository unless explicitly allowed. Wait for one issue to be assigned or resolved before requesting another.
6. **Code of Conduct:** Ensure all communication (issue bodies, comments, PR descriptions) is highly professional, respectful, and adheres to the project's code of conduct.
7. **Check Assignment Status:** NEVER request assignment for an issue that is already assigned to someone else. Always check the `assignees` list or previous comments before asking.
8. **Check Issue Labels:** Pay close attention to issue labels. Do not request assignment for issues labeled with `not-now`, `wontfix`, `invalid`, or any label indicating the issue is on hold.
9. **Context Isolation:** The AI agent MUST strictly focus ONLY on the project/repository associated with the current chat window or working directory. For example, if the current directory is `cradle`, the agent must only check issues, create PRs, and interact with the `cradle` project. NEVER suggest issues, explore, or intervene in other projects from this window.

---

# ECSoC '26 Specific Guidelines & Points System

You MUST optimize workflows for maximum Sentinel XP and adhere strictly to ECSoC26 limits:

## Points System (Sentinel XP)
- **Level 1** (Doc/Typos/Assets): 5 Points
- **Level 2** (UI/Fixes/Features): 10 Points
- **Level 3** (Core/Arch/Perf): **15 Points (Target these!)**

## Admin Bonus Labels
- `good-issue`: +10 XP
- `good-pr`: +15 XP
- `good-ui`: +25 XP
- `good-backend`: **+50 XP (Highest Priority!)**

## Rules & Limits
- **Daily Limit:** Max **5 PRs** scored per project per contributor daily.
- **Required Tag:** Pull requests MUST carry the `ECSoC26` label before or at the time of merge.

## Challenging Incorrect Labels
- **Defending XP Value:** Maintainers may accidentally assign a low-tier label (e.g., `ECSoC26-L1`) to complex PRs. You MUST proactively monitor the labels applied to your PRs.
- **Strong Rebuttals:** If an incorrect or unfair label is applied, immediately drop a polite but firm rebuttal comment. First, thoroughly analyze the exact work done in the PR. Based strictly on that analysis, determine its appropriate level according to the ECSoC criteria. Explicitly quote the official ECSoC points criteria and request the appropriate upgrade (e.g., `Level 2`, `Level 3`, `good-backend`) that genuinely matches the work done. Do not automatically ask for Level 3 unless the analysis fully supports it.

## Standard Workflow
1. **Creation & Approval:** The AI agent will draft issues and Pull Requests, but MUST wait for the user's explicit approval before actually creating/submitting them on GitHub.
2. **Find/Raise an Issue:** Find an open issue or raise a new one describing a bug/feature (after user approval).
3. **Ask to be Assigned:** Comment to request assignment. **DO NOT start working on any issue until the Admin has officially assigned it to the user.**
4. **Fork & Clone:** Once assigned, fork the repository, clone it, and checkout a task branch.
5. **Submit PR & Request Labels:** Open a PR against the main repository (after user approval). Before commenting on the PR, thoroughly analyze the completed work to determine its exact category (e.g., Core Backend, UI, Bug Fix). Immediately after a successful PR is created, drop a custom comment asking for review. In this comment, provide your analysis explaining exactly why the PR falls into a specific category, and explicitly ask the maintainers to add the `ECSoC26` label (if missing) along with the specific, justified XP labels (e.g., `Level 3`, `good-backend`, `good-pr`, etc.). Make sure the analysis is highly accurate and directly supports the labels you are requesting.

## Onboarding Checklist Tracking
- [x] Onboarded to the ECSoC '26 organization and Discord
- [ ] First repository setup check
- [x] Claim initial issue ticket (Waiting for assignment)
- [ ] Submit draft branch PR
- [ ] Merge first contribution PR
- [ ] Complete midpoint progress evaluation
