# Active-story docs (Claude Code convention)

This folder holds a flat, single-active-story snapshot of the same SDLC artifacts that live per-story under [`docs/sdlc/`](sdlc/README.md), driven by the `.claude/agents/` + `.claude/skills/` scaffolding instead of the GitHub Copilot prompts/chatmode. The two conventions are independent — this one exists for Claude Code sessions that work through `.claude/agents`, the other for Copilot Chat sessions.

```
docs/
  requirements.md    Requirements analyst output
  architecture.md    Solution architect output
  design-review.md   Design reviewer output
  impl-plan.md       Implementation planner output
  code-review.md     Quality/release engineer output — code review
  verification.md    Quality/release engineer output — actual test/build/lint/audit evidence
```

Because this layout is flat (one file per doc type, no per-story subfolder), it can only represent one story at a time. Starting a new story here means overwriting or archiving these files first — the per-story history that survives across stories lives in `docs/sdlc/<STORY-KEY>-<slug>/`, which this folder does not replace.

## Current contents

The files above currently reflect **EPMCDME-14102** (invoice email delivery, session auth, per-user ownership — [PR #3](https://github.com/SatyaPrakashRout363/Invoice-Generator/pull/3)), copied verbatim from `docs/sdlc/EPMCDME-14102-invoice-email-delivery/`. Chosen as the initial active story because it has the most complete real verification evidence (build/lint/audit output) to seed `verification.md` without fabricating anything.

## Pipeline

1. **Requirements** — `requirements-analyst` agent + `requirements-analysis` skill → `requirements.md`
2. **Architecture** — `solution-architect` agent + `architecture-design` skill → `architecture.md`
3. **Design Review** — `design-reviewer` agent → `design-review.md`
4. **Implementation Planning** — `implementation-planner` agent → `impl-plan.md`
5. **Implementation** — `implementation-engineer` agent (code diff is the output; no doc)
6. **Code Review** — `quality-release-engineer` agent + `code-review` skill → `code-review.md`
7. **Verification** — `quality-release-engineer` agent + `test-execution` skill → `verification.md`
8. **PR** — `quality-release-engineer` agent + `github-pr` skill, only after explicit sign-off on 6 and 7

Note: the reference structure this was modeled from used a `gitlab-mr` skill; since this repo is hosted on GitHub, it's named `github-pr` here and uses `gh pr create` instead of `glab mr create`.
