# Active-story docs (flat single-story convention)

This folder holds a flat, single-active-story snapshot of the same SDLC artifacts that live per-story under [`docs/sdlc/`](sdlc/README.md), driven by the `.github/agent/` + `.github/skill/` reference scaffolding described in [`.github/copilot-instructions.md`](../.github/copilot-instructions.md). The two conventions are independent — this one is a flat working snapshot of whichever story is currently active, the other is the durable per-story archive.

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

1. **Requirements** — `.github/agent/requirements-analyst.md` + `.github/skill/requirements-analysis.md` → `requirements.md`
2. **Architecture** — `.github/agent/solution-architect.md` + `.github/skill/architecture-design.md` → `architecture.md`
3. **Design Review** — `.github/agent/design-reviewer.md` → `design-review.md`
4. **Implementation Planning** — `.github/agent/implementation-planner.md` → `impl-plan.md`
5. **Implementation** — `.github/agent/implementation-engineer.md` (code diff is the output; no doc)
6. **Code Review** — `.github/agent/quality-release-engineer.md` + `.github/skill/code-review.md` → `code-review.md`
7. **Verification** — `.github/agent/quality-release-engineer.md` + `.github/skill/test-execution.md` → `verification.md`
8. **PR** — `.github/agent/quality-release-engineer.md` + `.github/skill/github-pr.md`, only after explicit sign-off on 6 and 7 (per `.github/hooks/pre-pr-signoff.md`)

Note: the reference structure this was modeled from used a `gitlab-mr` skill; since this repo is hosted on GitHub, it's named `github-pr` here and uses `gh pr create` instead of `glab mr create`.
