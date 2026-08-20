---
mode: agent
description: "Step 1 — Requirements: gather and document requirements for a story"
---

# Step 1: Requirements

Story: `${input:story}` (Jira key + short slug, e.g. `EPMCDME-14099-payment-status`)

Gather requirements for this story from the Jira issue (via the `jira` MCP server) and any linked description/comments, then write `docs/sdlc/${input:story}/01-requirements.md` containing:

- **Story Reference** — Jira key, link, and issue summary.
- **Decisions & Business Rules** — explicit rules the implementation must follow (states, thresholds, ownership rules, etc.), not left implicit.
- **Functional Requirements** — numbered (FR1, FR2, ...).
- **Non-Functional Requirements** — numbered (NFR1, NFR2, ...).
- **Acceptance Criteria** — numbered, testable scenarios.
- **Edge Cases** — explicitly called out, not folded into acceptance criteria.
- **Implementation Notes** — anything the requirements imply for the next steps but isn't itself a requirement.

Do not invent requirements not grounded in the Jira issue or explicit user input — if something is ambiguous, list it under a "Needs Clarification" section instead of guessing. Stop after writing the file and wait for human sign-off before moving to Step 2.
