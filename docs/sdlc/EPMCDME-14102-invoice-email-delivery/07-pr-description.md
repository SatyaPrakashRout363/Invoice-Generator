# PR Description — EPMCDME-14102 (invoice email delivery, auth, ownership)

Source: [PR #3](https://github.com/SatyaPrakashRout363/Invoice-Generator/pull/3), branch `claude_implementation`. Reproduced verbatim from the actual PR body.

# Summary

This PR implements EPMCDME-14102: outbound email delivery of invoices via SendGrid (with delivery-status tracking and retry), a session-based multi-user authentication layer (login/logout, lockout, password reset), and per-user invoice ownership — on top of the existing single-tenant Express/React invoice app. It was built per the approved `architecture.md` design (reviewed in `design-review.md`, verdict "Approved with Changes") and the task breakdown in `impl-plan.md`. Business value: the app moves from a single-tenant local tool to something multiple users can safely share, with invoices actually deliverable to clients by email instead of only downloadable as a PDF.

# Changes Made

**Requirements / Architecture / Design docs** (pre-existing on `origin/main` under `.claude/skills/`, not modified by this PR — used as source of truth, referenced here for reviewer context; now relocated to `docs/sdlc/EPMCDME-14102-invoice-email-delivery/01-04`):
- `requirement.md` — FR1–FR17 / NFR1–NFR8 for this story.
- `architecture.md` — approved system design.
- `design-review.md` — review verdict "Approved with Changes"; its one required fix (auth routes must not sit behind `requireSession`) is implemented (see `AUTH-04`/`routes/auth.js` below).
- `impl-plan.md` — task breakdown; used to track completion (see "Known Limitations" for the one Definition-of-Done item not met).

**Backend — foundation & persistence:**
- `api/package.json`, `api/package-lock.json` — added `express-session`, `session-file-store`, `bcrypt`, `@sendgrid/mail`; added a `test` script (`node --test`).
- `api/.env.example` — new required env vars: `SENDGRID_API_KEY`, `SENDER_EMAIL`, `SENDER_NAME`, `SESSION_SECRET`, `SEND_DRY_RUN`, `SESSION_MAX_AGE_DAYS`.
- `.gitignore` — added `api/data/users.json`, `api/data/resetTokens.json`, `api/sessions/`, `api/.env` so no runtime-generated secrets/data get committed.
- `api/utils/userStore.js` — new flat-file store for user accounts (mirrors existing `store.js` pattern).
- `api/utils/resetTokenStore.js` — new flat-file store for password-reset tokens.

**Backend — auth & sessions:**
- `api/utils/auth.js` — bcrypt password hashing/verification; reset-token generation/validation (single-use, 1hr expiry).
- `api/utils/rateLimit.js` — server-side login-lockout (5 attempts/15min) and send-rate-limit (50/user/hour) counters.
- `api/middleware/session.js` — `express-session` config: file-backed store, httpOnly cookie, `SameSite=Lax`, `secure` in production, ~30-day max-age.
- `api/middleware/requireSession.js` — 401 on any request without a valid session.
- `api/routes/auth.js` (new) — `POST /login`, `POST /logout`, `POST /forgot-password`, `POST /reset-password`. Login/forgot/reset are intentionally **not** behind `requireSession` (the design-review's required fix); only logout is.
- `api/scripts/create-user.js` — CLI to provision accounts (no self-service signup, per FR15).

**Backend — ownership:**
- `api/middleware/ownership.js` — filters invoice list to the caller's own invoices; returns 404 (not 403) for both "not found" and "belongs to another user," per architecture.md's stated design decision to avoid confirming existence.

**Backend — PDF, email, send, confirmation guard:**
- `api/utils/pdf.js` (new) — extracted the existing pdfkit-building logic so it can either stream to an HTTP response (unchanged behavior) or build a `Buffer` for email attachment.
- `api/utils/email.js` (new) — SendGrid wrapper with dry-run mode (`SEND_DRY_RUN`), retry logic capped at 3 attempts within a 15-second budget, HTML templates for invoice-send and password-reset emails.
- `api/routes/invoices.js` (modified) — added `POST /:id/send` (rate-limit check → email-format validation → PDF build → SendGrid send+retry → persist `deliveryStatus`/`lastSentAt`/`sendCount`/`sendHistory`); added a `409 confirmation_required` guard on `PUT /:id` and `DELETE /:id` when the invoice has already been sent and the request doesn't include `confirm: true`; new invoices now get `ownerId`, `deliveryStatus: 'Not Sent'`, `lastSentAt: null`, `sendCount: 0`, `sendHistory: []`.
- `api/server.js` (modified) — wires in session middleware and mounts the new `authRouter`; invoice routes are gated by `requireSession` at the router level.

**Frontend:**
- `ui/src/api.js` (modified) — `credentials: 'include'` on all requests, a distinguishable `AuthError` on 401, and new `authApi` (login/logout/forgotPassword/resetPassword) plus `invoiceApi.update`/`invoiceApi.send`.
- `ui/src/App.jsx` (modified) — login gate, edit mode for invoices, Send/Resend UI with delivery-status display, a confirmation dialog for editing/deleting an already-sent invoice, and forgot/reset-password forms.
- `ui/src/App.css` (new) — styling for the above.

**Tests:**
- `api/test/auth.test.js` — password hash/verify round trip; reset-token generate/validate/consume lifecycle; rejection of unknown tokens.
- `api/test/email.test.js` — dry-run send returns `Sent` without calling SendGrid; exhausted retries return `Failed`.
- `api/test/ownership.test.js` — `filterOwned`/`findOwned` correctness, including cross-user and unknown-ID cases.
- `api/test/rateLimit.test.js` — login-lockout threshold; send-rate-limit threshold.

**CI / Docs:**
- `.github/workflows/ci.yml` (modified) — added `npm test` step to the API job.
- `README.md` (modified) — documents new env vars, session-store behavior, and how to run `create-user.js` to provision the first account.

# Test Evidence

All results below are from actually running the commands on this branch (`claude_implementation`), not assumed.

**Unit tests** — `npm test` (`api/`, Node's built-in `node --test`):
```
tests 11
suites 0
pass 11
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 1292.2227
```
11/11 passing. Coverage: password hashing round-trip, reset-token lifecycle, unknown-token rejection, dry-run send, retry-exhaustion → Failed, ownership filter/reject logic (including cross-user and unknown-ID), login-lockout threshold, send-rate-limit threshold. **Gap:** no unit test exists for route-level "missing required field" validation (e.g. missing `invoiceNumber`, missing `username`/`password`) or for the recipient-email-format regex in isolation.

**Integration tests** — none exist in the repository (`Glob **/*.test.js` finds only the 4 unit-test files above; `Glob ui/**/*.test.*` finds none). Tests executed: 0, Passed: 0, Failed: 0. This does not meet `impl-plan.md` §7's Definition of Done, which requires every Acceptance Criteria scenario (1–13) to have a passing corresponding test — currently only unit-level coverage exists for the pieces listed above.

**Build/compile:**
- API — `node --check server.js` → `SYNTAX_OK`.
- UI — `npm run build` (vite) → `18 modules transformed`, `✓ built in 148ms`, output: `dist/index.html 0.48 kB`, `dist/assets/index-CkZexwwG.css 3.82 kB`, `dist/assets/index-bLxoHv0p.js 202.01 kB`.

**Static analysis / lint:**
- UI — `npm run lint` (`oxlint`) → exit code 0, no output. Clean pass.
- API — no lint/static-analysis tool is configured (`api/package.json` has no `lint` script). Not available, not run.

**Security / dependency check** — `npm audit`:
- `api/`: 2 vulnerabilities (1 high, 1 critical) — `tar <=7.5.20` (Arbitrary File Creation/Overwrite via Hardlink Path Traversal, GHSA-34x7-hfp2-rc4v + related advisories), reached transitively via `bcrypt@5.1.1 → @mapbox/node-pre-gyp@1.0.11 → tar@6.2.1`. Confirmed via `npm ls` that this is bcrypt's native-module build tooling, not code invoked by the running app. Fix available via `npm audit fix`.
- `ui/`: `found 0 vulnerabilities` (confirmed via `npm ls` that the UI has none of the affected packages).

# Known Limitations

- **No integration/end-to-end tests exist.** All 13 Acceptance Criteria scenarios in `requirement.md` are implemented and verified by code inspection only, not by an automated test that actually exercises the HTTP routes. This does not meet `impl-plan.md` §7's Definition of Done.
- **`PUT /:id` overwrite risk:** the update handler spreads the full request body onto the stored invoice, protecting only `id`/`ownerId` from being overwritten. A client resubmitting a stale invoice object (including its own copies of `deliveryStatus`/`sendCount`/`sendHistory`/`lastSentAt`) could silently overwrite those server-tracked fields. The `409 confirmation_required` guard itself still fires correctly and independently of this.
- **No unit test coverage** for route-level "missing required field" validation (create-invoice, login, reset-password) or for the recipient-email-format validation in isolation (only exercised indirectly inside the send-flow tests).
- **No static-analysis/lint tooling configured for the API** (UI has `oxlint`, clean).
- **One dependency advisory in the API** (1 high, 1 critical, via bcrypt's transitive build-tooling chain — `tar`), not reachable through the app's runtime/HTTP surface; fixable via `npm audit fix`, not applied in this PR pending approval.
- **Out of scope:** payment-status tracking (Unpaid/Paid/Overdue) is a separate ticket (EPMCDME-14099, tracked on `feature/payment-status`) and is not part of this change.
- **External dependency:** real (non-dry-run) email delivery requires a valid `SENDGRID_API_KEY`; not exercised against live SendGrid in this verification, only via dry-run mode and a simulated-failure unit test.

# Reviewer Checklist

- [ ] Requirements reviewed
- [ ] Architecture reviewed
- [ ] Design review completed
- [ ] Implementation reviewed
- [ ] Unit tests reviewed
- [ ] Integration tests reviewed
- [ ] Error handling reviewed
- [ ] Security considerations reviewed
- [ ] Dependency safety reviewed
- [ ] Verification completed
- [ ] Known limitations reviewed
