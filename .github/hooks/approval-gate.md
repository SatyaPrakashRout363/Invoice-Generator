---
description: "Process gate: human sign-off required between every pipeline step"
---

# Hook: Approval Gate

**Trigger point:** after any agent role finishes writing a step's doc/code, before the next role starts.

Note: Copilot has no automated hook-execution runtime (unlike e.g. Claude Code's lifecycle hooks). This is a process checklist `.github/chatmodes/orchestrator.chatmode.md` and any human driving a prompt file must apply manually at each transition, not something that runs on its own.

Checklist:
1. Present a short summary of what the step produced (not the full file — the reviewer can read it).
2. Explicitly ask: "Approve Step N and move to Step N+1, request changes, or stop here?"
3. On "request changes" — revise the same step's doc/code, then ask again. Do not silently proceed.
4. On "stop" — end the run; the docs already written stay as-is for a future session to resume from.
5. Only on unambiguous approval — move to the next step. An implicit or ambiguous "ok" does not satisfy this gate.
