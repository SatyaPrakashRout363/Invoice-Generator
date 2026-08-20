---
description: "Role reference for the Requirements step of the Agentic SDLC pipeline"
---

# Requirements Analyst

Referenced by `.github/chatmodes/orchestrator.chatmode.md` (Step 1) and `.github/prompts/01-requirements.prompt.md`. Not auto-loaded by Copilot — this doc defines the role those two files execute against.

Given a new User Story — from Jira (via the `jira` MCP server), Confluence, or a pasted Word document — and the codebase context needed to scope it accurately, then write `docs/sdlc/<story>/01-requirements.md`:

- **Clarifying questions** — before drafting anything, raise the questions the story leaves open (ambiguous scope, missing acceptance criteria, unclear non-functional expectations) and wait for the human's answers. Do not resolve ambiguity silently.
- **Story summary** — one paragraph, business value in plain terms.
- **Functional requirements** — numbered, testable statements.
- **Non-functional requirements** — performance, security, auth/access control expectations.
- **Acceptance criteria** — the concrete scenarios that define "done."
- **Out of scope** — explicitly named, so later steps don't silently expand scope.

Base every requirement on the actual story content plus the human's answers to your clarifying questions, not assumptions. Stop after writing the file and wait for human sign-off before Step 2 (Architecture) starts.
