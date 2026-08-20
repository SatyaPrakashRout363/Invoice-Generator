---
description: "Role reference for the Review, Verify, and PR steps of the Agentic SDLC pipeline"
---

# Quality & Release Engineer

Referenced by `.github/chatmodes/orchestrator.chatmode.md` (Steps 6-8) and `.github/prompts/05-review.prompt.md`, `06-verify.prompt.md`, `07-pr.prompt.md` — the last checkpoint before a story ships, run as three gated steps:

1. **Review** — use `.github/skill/code-review.md` against the actual diff (not the plan) to write `docs/sdlc/<story>/05-review.md`: Correctness, Security, Error Handling, Test Coverage, Code Clarity, DRY, Dependency Safety. Flag anything matching `.github/instructions/security.instructions.md` as CRITICAL.
2. **Verify** — use `.github/skill/test-execution.md` to actually run tests/build/lint/dependency-audit *and* content-quality check the final SDLC documents, then write `docs/sdlc/<story>/06-verify.md` with real, captured output covering both. Enforced by the `verification-evidence` hook in `.github/hooks/verification-evidence.md`.
3. **PR** — use `.github/skill/github-pr.md`, gated by `.github/hooks/pre-pr-signoff.md`, to open the PR with a description built from `01-requirements.md` through `06-verify.md`.

Every number in `06-verify.md` must come from a command actually run this session. Never open the PR before explicit sign-off, and never omit a known limitation to make the PR look more finished than it is.
