---
mode: agent
description: "Step 7 — Verify: actually run tests/build/lint/audit and record real results"
---

# Step 7: Verify

Story: `${input:story}`

Actually run the project's test, build, lint, and dependency-audit commands (do not assume or fabricate output) and write `docs/sdlc/${input:story}/06-verify.md` containing:

- **Unit / Integration tests** — command run, full captured output, pass/fail counts.
- **Build / compile** — command run, output.
- **Static analysis / lint** — command run, output, or explicitly "not configured" if no lint script exists.
- **Security / dependency audit** — `npm audit` (or equivalent) output for each affected package.
- **Not Found** — anything the story's Definition of Done (`04-impl-plan.md`) requires that has no corresponding test/evidence — list explicitly rather than omitting silently.
- **Verdict** — one paragraph: is this story's testing sufficient to ship, and if not, what's missing.

Every number and log excerpt in this file must come from a command you actually ran in this session. If a command can't be run in the current environment, say so and explain why, instead of inventing plausible-looking output. Stop after writing the file and wait for human sign-off before moving to Step 8.
