---
description: "Procedure: actually run tests/build/lint/audit and record real results in 06-verify.md"
---

# Test Execution

Used by: `.github/agent/quality-release-engineer.md` (Step 7). Enforced by `.github/hooks/verification-evidence.md`.

Input: completed implementation, `04-impl-plan.md`'s Definition of Done.

Procedure — verify the code first, then the documents:
1. Run the project's unit/integration test command; capture full output and pass/fail counts.
2. Run the build/compile command; capture output.
3. Run lint/static analysis if configured; capture output, or state explicitly "not configured."
4. Run a dependency/security audit (e.g. `npm audit`) for each affected package; capture output.
5. Compare results against `04-impl-plan.md`'s Definition of Done; list anything required that has no corresponding evidence under "Not Found" rather than omitting it.
6. Content-quality check the final output documents — read `01-requirements.md` through `05-review.md` and confirm each is internally consistent, actually reflects the shipped diff (not the original plan), and has no stale or contradicted claims; list any doc-quality gap found.
7. Write one verdict paragraph: is this sufficient to ship, and if not, what's missing.
8. Write `docs/sdlc/<story>/06-verify.md`, covering both the code evidence (steps 1-5) and the document content-quality check (step 6). Every number and log excerpt must come from a command actually run this session — never invent output.
