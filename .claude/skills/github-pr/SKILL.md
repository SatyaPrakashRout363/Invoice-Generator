---
name: github-pr
description: Write the PR description and open the pull request on GitHub
---

Input:
approved release package (docs/requirements.md through docs/verification.md), explicit human sign-off

Procedure:
1. Verify sign-off was given explicitly for this step — do not proceed on an implicit or ambiguous approval.
2. Verify the target branch is correct and diffs against the intended base.
3. Verify the diff matches what docs/code-review.md and docs/verification.md describe — no undocumented changes.
4. Verify tests referenced in docs/verification.md actually pass locally before opening the PR.
5. Commit any remaining doc/code changes with a message describing why, not just what.
6. Push the branch.
7. Create the pull request via `gh pr create`.
8. Generate the PR description from docs/requirements.md through docs/verification.md: Summary, Changes Made, Test Evidence (lifted from docs/verification.md, not reworded rosier), Known Limitations (every gap from docs/code-review.md and docs/verification.md's "Not Found" section), Reviewer Checklist.
