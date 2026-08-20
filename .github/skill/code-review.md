---
description: "Procedure: review the actual implementation diff and write 05-review.md"
---

# Code Review

Used by: `.github/agent/quality-release-engineer.md` (Step 6).

Input: completed implementation (diff against the base branch), `01-requirements.md` through `04-impl-plan.md`.

Procedure:
1. Read `01-requirements.md` through `04-impl-plan.md`.
2. Read the actual diff, not the plan — every finding must trace to a real changed line.
3. Check correctness against `01-requirements.md` and `04-impl-plan.md`; note any deviation and whether it's justified.
4. Check security: secrets handling, auth/access control, injection risk. Mark matches against `.github/instructions/security.instructions.md` as CRITICAL.
5. Check error handling: invalid input, concurrency, partial failures.
6. Check test coverage: what's tested, what isn't, whether the gap matters.
7. Check code clarity and DRY.
8. Check dependency safety for any new dependency introduced.
9. Write `docs/sdlc/<story>/05-review.md`, ending with a prioritized summary of what must be fixed before shipping.
