---
description: "Procedure: turn approved 01-requirements.md into 02-architecture.md"
---

# Architecture Design

Used by: `.github/agent/solution-architect.md` (Step 2).

Input: approved `01-requirements.md`.

Procedure:
1. Read `01-requirements.md` in full.
2. Read the existing codebase modules the story will touch.
3. Enumerate at least one alternative approach per major decision, and state why it was rejected.
4. Draw a component diagram (text/ASCII or Mermaid) and list each key component's responsibility.
5. Note any new technology choice (library, framework, pattern) and why.
6. Describe the data flow through the components for the story's main scenarios.
7. Specify data model changes (fields, tables, schemas).
8. Specify component boundaries (files/modules changed, new interfaces).
9. Specify integration points (external services, APIs, existing subsystems).
10. List risks and mitigations.
11. Cross-check every requirement in `01-requirements.md` is addressed; flag any that isn't.
12. Write `docs/sdlc/<story>/02-architecture.md`.
