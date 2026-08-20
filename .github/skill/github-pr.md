---
description: "Procedure: write the PR description and open the pull request on GitHub"
---

# GitHub PR

Used by: `.github/agent/quality-release-engineer.md` (Step 8). Gated by `.github/hooks/pre-pr-signoff.md`.

Input: approved release package (`01-requirements.md` through `06-verify.md`), explicit human sign-off.

Procedure:
1. Verify sign-off was given explicitly for this step — do not proceed on an implicit or ambiguous approval.
2. Verify the target branch is correct and diffs against the intended base.
3. Verify the diff matches what `05-review.md` and `06-verify.md` describe — no undocumented changes.
4. Verify tests referenced in `06-verify.md` actually pass locally before opening the PR.
5. Commit any remaining doc/code changes with a message describing why, not just what.
6. Push the branch.
7. Create the pull request via `gh pr create`.
8. Generate `07-pr-description.md` from `01-requirements.md` through `06-verify.md`: Summary, Changes Made, Test Evidence (lifted from `06-verify.md`, not reworded rosier), Known Limitations (every gap from `05-review.md` and `06-verify.md`'s "Not Found" section), Reviewer Checklist.
