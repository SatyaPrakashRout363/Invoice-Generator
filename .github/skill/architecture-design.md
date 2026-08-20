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
4. Specify data model changes (fields, tables, schemas).
5. Specify component boundaries (files/modules changed, new interfaces).
6. Specify integration points (external services, APIs, existing subsystems).
7. List risks and mitigations.
8. Cross-check every requirement in `01-requirements.md` is addressed; flag any that isn't.
9. Write `docs/sdlc/<story>/02-architecture.md`.
