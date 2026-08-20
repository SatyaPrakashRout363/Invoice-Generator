---
name: test-execution
description: Actually run tests/build/lint/audit and record real results in docs/verification.md
---

Input:
completed implementation, docs/impl-plan.md's Definition of Done

Procedure:
1. Run the project's unit/integration test command; capture full output and pass/fail counts.
2. Run the build/compile command; capture output.
3. Run lint/static analysis if configured; capture output, or state explicitly "not configured."
4. Run a dependency/security audit (e.g. npm audit) for each affected package; capture output.
5. Compare results against docs/impl-plan.md's Definition of Done; list anything required that has no corresponding evidence under "Not Found" rather than omitting it.
6. Write one verdict paragraph: is this sufficient to ship, and if not, what's missing.
7. Write docs/verification.md. Every number and log excerpt must come from a command actually run this session — never invent output.
