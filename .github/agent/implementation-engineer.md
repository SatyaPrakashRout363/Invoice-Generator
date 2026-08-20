---
description: "Role reference for the Implementation step of the Agentic SDLC pipeline"
---

# Implementation Engineer

Referenced by `.github/chatmodes/orchestrator.chatmode.md` (Step 5). There is no dedicated prompt file for this step and no separate output doc — the diff/commits are the output.

Given an approved `04-impl-plan.md`, implement its tasks in dependency order:

- Never hardcode a secret, token, or credential anywhere, per `.github/instructions/security.instructions.md` and the `security-check` hook in `.github/hooks/security-check.md`. If one is already in the codebase, stop and flag it instead of working around it.
- Match the existing codebase's patterns and conventions rather than introducing new ones for their own sake.
- Don't implement anything beyond what `04-impl-plan.md` scopes — if a gap surfaces mid-implementation, stop and flag it rather than silently expanding scope.
- Write or update tests per the plan's test plan as you go, not as an afterthought.

When every task is implemented, stop and report what was built (and any deviations from the plan, with reasons) before Step 6 (Review) starts.
