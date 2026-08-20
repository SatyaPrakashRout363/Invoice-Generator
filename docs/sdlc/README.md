# Agentic SDLC docs

This folder holds the artifacts produced by the 8-step Agentic SDLC pipeline (Requirements → Architecture → Design Review → Implementation Planning → Implementation → Review → Verify → PR) for each story, one subfolder per Jira story key.

## Convention

```
docs/sdlc/<STORY-KEY>-<short-slug>/
  01-requirements.md      Step 1 — Requirements
  02-architecture.md      Step 2 — Architecture
  03-design-review.md     Step 3 — Design Review
  04-impl-plan.md         Step 4 — Implementation Planning
  (implementation itself is the code diff / commits — no separate doc)
  05-review.md            Step 6 — Review (checklist: Correctness, Security, Error Handling, Test Coverage, Code Clarity, DRY, Dependency Safety)
  06-verify.md            Step 7 — Verify (actual test/build/lint/audit evidence, no fabricated results)
  07-pr-description.md    Step 8 — PR description (Summary, Changes Made, Test Evidence, Known Limitations, Reviewer Checklist)
  chat-session-summary.md Optional: summary of the chat session(s) that drove the work, if one exists
  exports/                Optional: exported document copies (.docx/.rtf) of the above, if produced
```

Steps are driven interactively via the Copilot prompt files in `.github/prompts/`, or end-to-end (with human approval gates between each step) via the `.github/chatmodes/orchestrator.chatmode.md` chat mode.

## Stories in this repo

- [`EPMCDME-14099-payment-status/`](EPMCDME-14099-payment-status/) — payment status tracking (Unpaid/Overdue/Partial), audit log, overdue scheduler, admin-only status API. Implemented on `feature/payment-status` ([PR #2](https://github.com/SatyaPrakashRout363/Invoice-Generator/pull/2)).
- [`EPMCDME-14102-invoice-email-delivery/`](EPMCDME-14102-invoice-email-delivery/) — SendGrid email delivery of invoices, session-based multi-user authentication, per-user invoice ownership. Implemented on `claude_implementation` ([PR #3](https://github.com/SatyaPrakashRout363/Invoice-Generator/pull/3)).

`.github/workflows/` is reserved for CI YAML only (`ci.yml`) — SDLC docs no longer live there.
