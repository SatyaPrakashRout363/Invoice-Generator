---
mode: agent
description: "Step 6 — Review: check the implementation against the plan"
---

# Step 6: Review

Story: `${input:story}`

After implementation is complete (Step 5), read `docs/sdlc/${input:story}/01-requirements.md` through `04-impl-plan.md`, then review the actual code changes (diff against the base branch) and write `docs/sdlc/${input:story}/05-review.md` with a checklist covering:

- **Correctness** — does the implementation do what `01-requirements.md` and `04-impl-plan.md` describe? Any deviations, and are they justified?
- **Security** — secrets handling, auth/access control, injection risks. Flag anything matching `.github/instructions/security.instructions.md`'s hard rules as CRITICAL.
- **Error Handling** — invalid input, concurrency, partial failures.
- **Test Coverage** — what's tested, what isn't, and whether that gap matters.
- **Code Clarity** — is the code readable without needing this doc to explain it?
- **DRY** — any duplicated logic that should be extracted?
- **Dependency Safety** — new dependencies, their audit status, license concerns.

Base every finding on the actual diff, not assumptions — read the changed files. End with a short **Summary** of the highest-priority items to fix before this ships. Stop after writing the file and wait for human sign-off before moving to Step 7.
