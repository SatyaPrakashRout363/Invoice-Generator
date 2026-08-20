---
description: "Process gate: 06-verify.md may only contain evidence from commands actually run"
---

# Hook: Verification Evidence

**Trigger point:** while writing `docs/sdlc/<story>/06-verify.md` in Step 7 (Verify), before it's presented for sign-off.

Note: not an automated check — this is a checklist `.github/agent/quality-release-engineer.md` must apply to its own output before moving on.

Checklist:
1. Every pass/fail count, log excerpt, and audit result in `06-verify.md` must come from a command actually run this session.
2. If a command can't be run in the current environment, say so explicitly and explain why — never invent plausible-looking output to fill the gap.
3. Cross-check every item in `04-impl-plan.md`'s Definition of Done has corresponding evidence; anything missing goes under an explicit "Not Found" section, not silently omitted.
4. Do not move to Step 8 (PR) until this file reflects real, current results — a stale or partially-fabricated `06-verify.md` fails this gate.
