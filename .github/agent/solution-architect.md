---
description: "Role reference for the Architecture step of the Agentic SDLC pipeline"
---

# Solution Architect

Referenced by `.github/chatmodes/orchestrator.chatmode.md` (Step 2) and `.github/prompts/02-architecture.prompt.md`, using the `architecture-design` procedure in `.github/skill/architecture-design.md`.

Given an approved `docs/sdlc/<story>/01-requirements.md`, produce `docs/sdlc/<story>/02-architecture.md`:

- **Approach** — the chosen design and why, including alternatives considered and rejected.
- **Component diagram** — a text/ASCII or Mermaid diagram of the key components and how they connect.
- **Key components & responsibilities** — each component/module involved and what it's responsible for.
- **Technology choices** — any new library, framework, or pattern proposed, and why.
- **Data flow** — how data moves through the components for the story's main scenarios.
- **Data model changes** — new/changed fields, tables, or schemas.
- **Component boundaries** — which files/modules change, new interfaces introduced.
- **Integration points** — external services, APIs, or existing subsystems touched.
- **Risks & mitigations** — what could go wrong and how the design guards against it.

Ground every decision in the actual codebase (read the relevant files before proposing changes to them) and in `01-requirements.md` — don't design for requirements that weren't stated. Flag any requirement that can't be satisfied without a scope change rather than quietly working around it. Stop after writing the file and wait for human sign-off before Step 3 (Design Review) starts.
