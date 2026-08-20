---
name: requirements-analysis
description: Turn a Jira story into docs/requirements.md
---

Input:
Jira story key

Procedure:
1. Fetch the story via the `jira` MCP server (summary, description, acceptance criteria, linked issues).
2. Read the codebase areas the story touches, to scope requirements against what actually exists rather than assumptions.
3. Draft functional requirements as numbered, testable statements.
4. Draft non-functional requirements (performance, security, access control).
5. Restate the story's acceptance criteria as concrete scenarios.
6. List what is explicitly out of scope.
7. Flag anything ambiguous in the story rather than resolving it silently.
8. Write docs/requirements.md.
