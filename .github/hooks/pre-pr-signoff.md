---
description: "Process gate: PR may only be opened after explicit human sign-off on the PR description"
---

# Hook: Pre-PR Sign-off

**Trigger point:** immediately before running `gh pr create` in Step 8 (PR).

Note: not an automated check — this is the last checklist `.github/agent/quality-release-engineer.md` and `.github/skill/github-pr.md` must apply before the PR becomes visible to reviewers.

Checklist:
1. `docs/sdlc/<story>/07-pr-description.md` has been written and shown to the human.
2. The human has given unambiguous sign-off on that description specifically — not on the story as a whole, not implied by an earlier "looks good."
3. No Known Limitation from `05-review.md` or `06-verify.md`'s "Not Found" section has been dropped to make the PR look more finished than it is.
4. Only after 1-3 are satisfied: push the branch and open the PR.
