---
mode: agent
description: "Step 2 — Architecture: design the system changes for a story"
---

# Step 2: Architecture

Story: `${input:story}`

Read `docs/sdlc/${input:story}/01-requirements.md` (must exist and be signed off). Design the system changes needed to satisfy it, and write `docs/sdlc/${input:story}/02-architecture.md` containing:

- **Overview** — what's changing and why, one paragraph.
- **Components affected** — files/modules that will change or be added, backend and frontend.
- **Data model changes** — new fields, tables, or files, with types and defaults.
- **API changes** — new/modified endpoints, request/response shapes, auth requirements.
- **Design decisions** — the non-obvious choices (why this data model, why this auth approach, why this storage) and the alternatives considered.
- **Risks & mitigations** — what could go wrong with this design and how it's mitigated.
- **Open questions** — anything that needs a decision before Design Review.

Ground every claim in the actual current codebase — check existing patterns (e.g. `api/utils/store.js`) before proposing new ones, and prefer following established conventions over introducing new ones. Stop after writing the file and wait for human sign-off before moving to Step 3.
