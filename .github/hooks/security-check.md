---
description: "Process gate: no hardcoded secrets, at any step that touches code or config"
---

# Hook: Security Check

**Trigger point:** continuously during Step 5 (Implementation), and explicitly during Step 6 (Review) — any time a file containing credentials, config, or `.env`/`.mcp.json`-style connection settings is written or edited.

Note: not an automated scan — this is a checklist `.github/agent/implementation-engineer.md` and `.github/agent/quality-release-engineer.md` must apply themselves, per `.github/instructions/security.instructions.md`.

Checklist:
1. Never write a literal secret, token, password, or API key into a tracked file.
2. Credentials belong in environment variables referenced by name (e.g. `${JIRA_USERNAME}`), never inlined.
3. If a hardcoded credential is found in existing code, stop and flag it — do not silently work around it or remove it without telling the human.
4. Before any commit, re-check the diff for anything that looks like a credential, even in a file whose name looks innocuous.
5. Flag any finding matching this hook as CRITICAL in `05-review.md`.
