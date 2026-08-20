---
description: "Procedure: turn a Jira story into 01-requirements.md"
---

# Requirements Analysis

Used by: `.github/agent/requirements-analyst.md` (Step 1).

Input: a new User Story from Jira (story key, via the `jira` MCP server), Confluence, or a pasted Word document.

Procedure:
1. Fetch/read the story (Jira story via the `jira` MCP server, or the pasted Confluence/Word content).
2. Read the codebase areas the story touches, to scope requirements against what actually exists rather than assumptions.
3. Ask clarifying questions on anything ambiguous or underspecified in the story, and wait for the human's response before proceeding — never resolve ambiguity silently.
4. Draft functional requirements as numbered, testable statements.
5. Draft non-functional requirements (performance, security, access control).
6. Restate the story's acceptance criteria as concrete scenarios.
7. List what is explicitly out of scope.
8. Write `docs/sdlc/<story>/01-requirements.md`.
