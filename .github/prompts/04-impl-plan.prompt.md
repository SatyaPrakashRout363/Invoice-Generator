---
mode: agent
description: "Step 4 — Implementation Planning: break the approved design into tasks"
---

# Step 4: Implementation Planning

Story: `${input:story}`

Read `01-requirements.md`, `02-architecture.md`, and `03-design-review.md` under `docs/sdlc/${input:story}/` (design review verdict must be "Approved" or "Approved with Changes", with required fixes folded into this plan). Write `docs/sdlc/${input:story}/04-impl-plan.md` containing:

- **Overview** — restates the goal in one paragraph.
- **Task Breakdown** — numbered tasks, each with: description, priority, dependencies, blockers, expected outcome.
- **Dependency Order** — the order tasks must be implemented in.
- **Blocked Tasks** — anything waiting on an external decision or resource.
- **Testing Plan** — unit/integration test strategy for the new behavior.
- **Definition of Done** — the checklist that must be true before this story is considered implemented.
- **Missing Information** — open questions that need an answer before or during implementation.

This plan is what Step 5 (Implementation) and Step 7 (Verify, via the Definition of Done) will be checked against — be concrete and specific rather than aspirational. Stop after writing the file and wait for human sign-off before implementation begins.
