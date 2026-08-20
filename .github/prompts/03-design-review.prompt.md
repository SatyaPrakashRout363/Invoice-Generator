---
mode: agent
description: "Step 3 — Design Review: critique the architecture before implementation starts"
---

# Step 3: Design Review

Story: `${input:story}`

Read `docs/sdlc/${input:story}/01-requirements.md` and `02-architecture.md` (both must exist and be signed off). Critically review the architecture against the requirements and write `docs/sdlc/${input:story}/03-design-review.md` containing:

- **Verdict** — one of: Approved / Approved with Changes / Rejected.
- **Requirements coverage** — does every FR/NFR/acceptance criterion in `01-requirements.md` map to something in the architecture? List any gaps.
- **Required fixes** — changes that must be made before implementation starts (only if verdict is "Approved with Changes" or "Rejected").
- **Suggested improvements** — non-blocking recommendations.
- **Security review** — auth, secrets handling, injection risks, access control.
- **Risks accepted** — risks from `02-architecture.md` that are being knowingly accepted as-is, with rationale.

Be genuinely critical — this step exists to catch design problems before they become code. Do not rubber-stamp. Stop after writing the file and wait for human sign-off before moving to Step 4.
