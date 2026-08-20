---
name: code-review
description: Review the actual implementation diff against the plan and write docs/code-review.md
---

Input:
completed implementation (diff against the base branch), docs/requirements.md through docs/impl-plan.md

Procedure:
1. Read docs/requirements.md through docs/impl-plan.md.
2. Read the actual diff, not the plan — every finding must trace to a real changed line.
3. Check correctness against docs/requirements.md and docs/impl-plan.md; note any deviation and whether it's justified.
4. Check security: secrets handling, auth/access control, injection risk. Mark matches against security hard rules as CRITICAL.
5. Check error handling: invalid input, concurrency, partial failures.
6. Check test coverage: what's tested, what isn't, whether the gap matters.
7. Check code clarity and DRY.
8. Check dependency safety for any new dependency introduced.
9. Write docs/code-review.md, ending with a prioritized summary of what must be fixed before shipping.
