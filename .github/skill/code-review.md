---
description: "Procedure: review the actual implementation diff and write 05-review.md"
---

# Code Review

Used by: `.github/agent/quality-release-engineer.md` (Step 6).

Input: completed implementation (diff against the base branch), `01-requirements.md` through `04-impl-plan.md`.

Procedure:
1. Read `01-requirements.md` through `04-impl-plan.md`.
2. Read the actual diff, not the plan — every finding must trace to a real changed line.
3. Work through the checklist, one row per review area, and answer its question directly:

   | Review Area | Review Question |
   |---|---|
   | Correctness | Does each component behave as specified in `01-requirements.md`? |
   | Security | Are secrets excluded from output? Is user input validated? |
   | Error Handling | Are all API failures, missing files, and empty repos handled gracefully? |
   | Test Coverage | Do tests cover the happy path AND the "Not Found" / missing-field edge cases? |
   | Code Clarity | Are function names self-explanatory? Is logic easy to follow without comments? |
   | DRY Principle | Is there duplicated logic that can be refactored into a shared function? |
   | Dependency Safety | Does any new or changed dependency have a known-vulnerable version? |

4. Mark any Security finding that matches `.github/instructions/security.instructions.md` as CRITICAL.
5. Write `docs/sdlc/<story>/05-review.md`, ending with a prioritized summary of what must be fixed before shipping.
