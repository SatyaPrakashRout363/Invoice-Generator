# Implementation Plan — EPMCDME-14102

Source of truth: `.claude/skills/requirement/requirement.md` (business requirements, FR1–FR17/NFR1–NFR8), `.claude/skills/architecture/architecture.md` (approved architecture), `.claude/skills/design/design-review.md` (review findings/decisions). No production code is written or modified by this document.

**Blocker flagged up front:** `design-review.md` returned a verdict of *Approved with Changes*, not unconditional approval. Its required change — correcting the §3 component diagram so `AuthRoutes` (login/forgot-password/reset-password) are not gated behind `requireSession` — has not been applied to `architecture.md` as of this writing (verified: no commits to `architecture.md` since the review). This plan is written against the **corrected** scoping described in `design-review.md` §6 (since that is the documented resolution), but `architecture.md` itself still needs that diagram fix applied by whoever owns it. Treat this as Precondition P0-1 below, not as something already resolved.

## 1. Overview

This story adds three things on top of the existing single-tenant Express/React invoice app: (a) outbound email delivery of invoices via SendGrid with delivery-status tracking and retry, (b) a login-gated, multi-user, session-based authentication layer with lockout and password reset, and (c) per-user ownership of invoices. The architecture keeps the current modular-monolith shape — no new datastore, extending the existing flat-file JSON pattern (`store.js`) to two new files (`users.json`, `resetTokens.json`) and new fields on `invoices.json` records. New responsibilities are added as new middleware/route/utility modules alongside the existing `routes/`, `utils/` layout; no existing module is replaced wholesale — `invoices.js`, `store.js`, and `totals.js` are extended, and the pdfkit logic is refactored (not rewritten) to be reusable for both HTTP streaming and email attachment.

Four decisions remain genuinely open per `design-review.md` and are **not** resolved by inventing an answer here (see §4, Preconditions): the CSRF defense baseline, the account-provisioning mechanism for FR15, password complexity policy, and formal sign-off on the `confirm: true` transport for the edit/delete-of-sent-invoice guard. Tasks that depend on these are explicitly marked blocked.

## 2. Implementation Tasks

### Phase 0 — Preconditions (decisions required before dependent tasks can start)

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| P0-1 | Correct the `architecture.md` §3 diagram so `AuthRoutes` (`/auth/login`, `/auth/forgot-password`, `/auth/reset-password`) are not drawn behind `requireSession`; only `/auth/logout` and invoice-facing routes are gated. | High | None | None | `architecture.md` diagram matches its own §4.1 prose and requirement.md Scenario 7; unblocks AUTH-04/AUTH-05/AUTH-07 |
| P0-2 | Decide the CSRF defense baseline for cookie-based sessions (e.g. `SameSite` attribute vs. token-based defense), per `design-review.md` §4 item 2. | High | None | None | A stated, approved CSRF posture to implement in AUTH-03/SEC-01 |
| P0-3 | Decide the account-provisioning mechanism for FR15 (CLI script, direct `users.json` edit, or admin-only route), per `design-review.md` §4 item 3. | Medium | None | None | A concrete mechanism to build in D-04/DOC-02, or an explicit decision that no tooling is built (manual file edits only) |
| P0-4 | Decide password complexity policy for account creation and reset, per `design-review.md` §4 item 4 (currently assumed: none). | Medium | None | None | A stated policy (or explicit confirmation of "no policy") to validate against in AUTH-02/AUTH-07 |

None of P0-1..P0-4 are implementation work; they are sign-offs needed from whoever owns `architecture.md`/the product decision. Everything else in this plan either depends on one of these or can proceed in parallel with them.

### Phase 1 — Foundation

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| F-01 | Add new backend dependencies: `express-session`, a file-backed session store (e.g. `session-file-store`), `bcrypt`, `@sendgrid/mail` to `api/package.json`. | High | None | None | Dependencies declared and installable; no existing dependency removed or changed |
| F-02 | Define and document required environment variables: `SENDGRID_API_KEY`, `SESSION_SECRET`, sender identity (`SENDER_EMAIL`/`SENDER_NAME`), `SEND_DRY_RUN`, session cookie max-age (~30 days). | High | None | None | `.env.example` (or equivalent) lists every secret/config NFR2 requires; nothing hardcoded |

### Phase 2 — Data Model / Persistence

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| D-01 | Extend the Invoice shape (creation in `POST /`, read/write in `store.js`) with `ownerId`, `deliveryStatus` (default `Not Sent`), `lastSentAt` (`null`), `sendCount` (`0`), `sendHistory` (`[]`), per architecture.md §5. | High | None | None | New invoices carry all delivery/ownership fields; `store.js` read path defaults missing fields for forward compatibility (current `invoices.json` is empty, so no migration of existing rows is needed) |
| D-02 | Create `api/utils/userStore.js` — read/write `users.json`, implementing the User model (`id`, `username`, `passwordHash`, `createdAt`). | High | None | None | Store module symmetrical to the existing `store.js` pattern |
| D-03 | Create `api/utils/resetTokenStore.js` — read/write `resetTokens.json`, implementing PasswordResetToken (`tokenHash`, `userId`, `expiresAt`, `used`). | High | D-02 | None | Store module ready for AUTH-06 |
| D-04 | Build the account-provisioning mechanism decided in P0-3 (script or route) to create users with bcrypt-hashed passwords. | Medium | D-02, AUTH-01 | P0-3 | At least one usable path to provision a real account before go-live |

### Phase 3 — Auth Core (hashing, lockout, rate limiting)

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| AUTH-01 | Implement `hashPassword`/`verifyPassword` helpers using `bcrypt` (NFR5). | High | F-01 | None | Passwords never stored/compared in plaintext |
| RATE-01 | Implement login-lockout counters (`username → {failedCount, lockedUntil}`), 5 failed attempts / 15-minute lock (FR13, NFR8). | High | None | None | Server-side lockout enforced independent of UI |
| RATE-02 | Implement send-rate-limit counters (`userId → timestamps in the last hour`), cap 50/user/hour (FR8, NFR8). | High | None | None | Server-side rate limiting enforced independent of UI |
| AUTH-02 | Implement Auth Service login logic: verify credentials via D-02/AUTH-01, consult RATE-01 before and after each attempt. | High | D-02, AUTH-01, RATE-01 | P0-4 (for any password-policy check on the login path, if applicable) | Correct 401 on bad credentials, 403 with remaining lockout time when locked, session-worthy result on success |
| AUTH-06 | Implement password-reset token generation: single-use, 1-hour expiry, stored hashed (FR14, NFR7). | High | D-03, AUTH-01 | None | Token generation/validation utility ready for AUTH-07 |

### Phase 4 — Session & Auth Routes

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| AUTH-03 | Configure `express-session` + file-backed store: httpOnly cookie, `secure` in production, ~30-day max-age (FR12, NFR6), including the CSRF baseline from P0-2. | High | F-01, F-02 | P0-2 | Session cookie configuration matches FR12/NFR6 and the approved CSRF posture |
| AUTH-04 | Implement `requireSession` middleware, applied **only** to invoice-facing routes and `POST /auth/logout` — explicitly excluding `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` (corrected scope per `design-review.md` §6). | High | AUTH-03 | P0-1 | 401 on any invoice/send/logout request without a valid session; login/forgot/reset remain reachable unauthenticated |
| AUTH-05 | Implement `POST /auth/login`, `POST /auth/logout` routes wired to AUTH-02/AUTH-04. | High | AUTH-02, AUTH-04 | P0-1 | Scenario 8/9 behavior (successful login issues session; lockout after 5 failures) |
| AUTH-07 | Implement `POST /auth/forgot-password` (always generic 200 response, per design-review.md §8) and `POST /auth/reset-password` (validate token unexpired/unused, apply new password, mark token used). | High | AUTH-06, EMAIL-01, EMAIL-04 | P0-1, P0-4 | Scenario 10 behavior; no username enumeration; expired/reused tokens rejected with a generic error |

### Phase 5 — Ownership

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| OWN-01 | Implement `api/middleware/ownership.js`: filter list results to `req.session.userId`; reject 403/404 on get/update/delete/send for another user's invoice; pass-through + assign `ownerId` on create. | High | D-01, AUTH-04 | AUTH-04 (needs `req.session.userId` populated) | FR16/FR17 enforced server-side, not just hidden in UI |
| OWN-02 | Wire session + ownership middleware onto all existing invoice routes (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `GET /:id/pdf`). | High | OWN-01 | OWN-01 | Scenario 11 behavior across every route, including the PDF route (not explicitly named in FR16/17 but correctly in scope per design-review.md §1) |

### Phase 6 — PDF Refactor

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| PDF-01 | Refactor the pdfkit-building logic currently inline in `invoices.js`'s `/:id/pdf` handler into a reusable function that either streams to an HTTP response (existing behavior, unchanged output) or returns a `Buffer` (for email attachment). | High | None | None | Behavior-preserving refactor; existing `/:id/pdf` output must be byte-for-byte equivalent; no route/API contract change |

### Phase 7 — Email Service

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| EMAIL-01 | Implement `EmailService` wrapping `@sendgrid/mail`: `send(to, subject, html, attachments)`, with a dry-run mode gated by `SEND_DRY_RUN` (FR9). | High | F-01, F-02 | None | Real sends only occur when dry-run is off; dry-run simulates success/failure without contacting SendGrid |
| EMAIL-02 | Implement retry-with-backoff inside `EmailService`, bounded to the 15-second total budget (FR4, NFR3), using a small fixed attempt count (2–3) with short delays. | High | EMAIL-01 | None | All attempts complete or give up within 15s; never open-ended backoff |
| EMAIL-03 | Implement the HTML invoice-email template (invoice number, total, due date, per FR7), sent from the fixed sender identity. | Medium | EMAIL-01 | None | Email body content matches FR7 |
| EMAIL-04 | Implement the password-reset email send (reuses EMAIL-01, FR14). | Medium | EMAIL-01, AUTH-06 | None | Reset link delivered via the same EmailService used for invoice sends |

### Phase 8 — Send Endpoint

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| SEND-01 | Implement recipient-email format validation (FR2), rejecting before any SendGrid call. | High | None | None | Malformed/missing `to.email` never reaches SendGrid |
| SEND-02 | Implement `POST /invoices/:id/send`: session+ownership guard, rate-limit check, email validation, PDF buffer, EmailService send+retry, persist `deliveryStatus`/`lastSentAt`/`sendCount`/`sendHistory`. | High | OWN-02, RATE-02, SEND-01, PDF-01, EMAIL-02, EMAIL-03, D-01 | OWN-02, RATE-02, SEND-01, PDF-01, EMAIL-02, EMAIL-03 | Scenarios 1, 3, 4, 12 behavior; this is the integration point for most of Phases 2–7 |

### Phase 9 — Confirmation Guard

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| CONF-01 | Implement the "already sent" confirmation guard on `PUT /:id` and `DELETE /:id`: return 409 `confirmation_required` unless the request includes `confirm: true`, per architecture.md §4.3/§6. | Medium | D-01, OWN-02 | None (proceeding on the currently-documented contract; flagged in design-review.md §4 item 1 as needing formal sign-off — revisit if that sign-off changes the transport) | Scenario 6 behavior |

### Phase 10 — UI

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| UI-01 | Update `ui/src/api.js`: send session cookie with requests, handle 401 responses, add `login`/`logout`/`forgotPassword`/`resetPassword`/`send` API calls. | High | AUTH-05 | AUTH-05 | Fetch wrapper supports every new endpoint |
| UI-02 | Add a login screen and route guarding in `App.jsx` (redirect to login on 401/no session). | High | UI-01 | UI-01 | Scenario 7 reflected in the UI |
| UI-03 | Add "Send"/"Resend" actions and `deliveryStatus`/`lastSentAt` display to the invoice list (FR4/FR5). | High | SEND-02 | SEND-02 | Scenario 5 reflected in the UI |
| UI-04 | Add a confirmation dialog for editing/deleting an already-sent invoice, wired to CONF-01's 409 response. | Medium | CONF-01 | CONF-01 | Scenario 6 reflected in the UI |
| UI-05 | Add "Forgot password"/"Reset password" screens wired to AUTH-07. | Medium | AUTH-07 | AUTH-07 | Scenario 10 reflected in the UI |

### Phase 11 — Security Hardening

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| SEC-01 | Apply the CSRF baseline decided in P0-2 across session config and all state-changing routes (login, invoice mutate, send). | High | AUTH-03 | P0-2 | Approved CSRF posture actually enforced, not just documented |
| SEC-02 | Secrets audit: confirm `SENDGRID_API_KEY`, `SESSION_SECRET`, sender identity are read only from env vars, and any local secrets file is gitignored (NFR2). | High | F-02 | None | No secret present in the repository at any point in history for new files added by this story |

### Phase 12 — Documentation

| ID | Description | Priority | Dependencies | Blocked By | Expected Outcome |
|---|---|---|---|---|---|
| DOC-01 | Update README with new env vars, session-store setup, SendGrid config, dry-run flag. | Medium | F-02, AUTH-03, EMAIL-01 | None | New contributor can configure and run the auth/email features from README alone |
| DOC-02 | Document the account-provisioning steps decided in P0-3. | Medium | D-04 | P0-3 | Operator knows how to create the first real account |

## 3. Dependency Order

Recommended build order, respecting the dependency graph above (parallel tracks noted where independent):

1. **P0-1 … P0-4** — must be resolved (or explicitly deferred with a documented interim assumption approved by the doc owner) before Phase 4/9/11 tasks that depend on them; everything else can start in parallel.
2. **F-01, F-02** (Foundation) — no dependencies; start immediately.
3. **D-01, D-02, PDF-01, SEND-01, RATE-01, RATE-02, EMAIL-01** — no dependencies beyond F-01/F-02; can all proceed in parallel once Phase 1 lands.
4. **D-03** depends on D-02. **AUTH-01** depends on F-01. **EMAIL-02, EMAIL-03** depend on EMAIL-01.
5. **AUTH-02** depends on D-02 + AUTH-01 + RATE-01. **AUTH-06** depends on D-03 + AUTH-01. **AUTH-03** depends on F-01/F-02 and is blocked by P0-2.
6. **AUTH-04** depends on AUTH-03 and is blocked by P0-1. **EMAIL-04** depends on EMAIL-01 + AUTH-06.
7. **AUTH-05** depends on AUTH-02 + AUTH-04 (blocked by P0-1). **OWN-01** depends on D-01 + AUTH-04.
8. **AUTH-07** depends on AUTH-06 + EMAIL-01 + EMAIL-04 (blocked by P0-1, P0-4). **OWN-02** depends on OWN-01.
9. **SEND-02** depends on OWN-02 + RATE-02 + SEND-01 + PDF-01 + EMAIL-02 + EMAIL-03 — the single largest fan-in in this plan; do not start it until all six are complete.
10. **CONF-01** depends on D-01 + OWN-02.
11. **D-04** depends on D-02 + AUTH-01, blocked by P0-3. **DOC-02** depends on D-04.
12. **UI-01** depends on AUTH-05. **UI-02** depends on UI-01. **UI-03** depends on SEND-02. **UI-04** depends on CONF-01. **UI-05** depends on AUTH-07.
13. **SEC-01** depends on AUTH-03, blocked by P0-2. **SEC-02** depends on F-02.
14. **DOC-01** depends on F-02 + AUTH-03 + EMAIL-01; can be drafted incrementally as those land.

The critical path (longest chain) runs: **P0-1/P0-2 → F-01/F-02 → AUTH-01/D-02/RATE-01 → AUTH-02 → AUTH-03 → AUTH-04 → AUTH-05 → OWN-01 → OWN-02 → SEND-02 → UI-03.** Everything on this path is High priority; keep it unblocked first.

## 4. Blocked Tasks

| Task | Blocked By | Why |
|---|---|---|
| AUTH-04 | P0-1 | The corrected scope (auth routes excluded from `requireSession`) must be settled — and reflected in `architecture.md` — before the middleware is wired, or the same login-deadlock bug the design review caught gets built into the code. |
| AUTH-05 | P0-1 | Login/logout routing depends directly on AUTH-04's corrected scope. |
| AUTH-07 | P0-1, P0-4 | Same scope correction applies to forgot/reset-password routes; additionally, the new-password validation logic can't be written without a password-complexity decision. |
| AUTH-03 | P0-2 | Session cookie config (including any CSRF-related attributes) should be set once, correctly, not retrofitted — needs the CSRF baseline decided first. |
| SEC-01 | P0-2 | Cannot enforce a CSRF posture that hasn't been chosen. |
| D-04 | P0-3 | No agreed provisioning mechanism to build yet. |
| DOC-02 | P0-3 (via D-04) | Can't document a procedure that doesn't exist. |
| OWN-01 | AUTH-04 | Needs `req.session.userId` to be populated by session middleware before it can filter/reject by owner. |
| OWN-02 | OWN-01 | Route wiring needs the middleware to exist first. |
| SEND-02 | OWN-02, RATE-02, SEND-01, PDF-01, EMAIL-02, EMAIL-03 | It is the integration point consuming all of these; starting it earlier would mean stubbing out most of the system. |
| UI-01 | AUTH-05 | The fetch wrapper needs real login/logout endpoints to call. |
| UI-02 | UI-01 | Route guarding needs the updated fetch wrapper's 401 handling. |
| UI-03 | SEND-02 | Nothing to display until the send endpoint exists. |
| UI-04 | CONF-01 | The dialog is wired to a 409 contract that doesn't exist yet. |
| UI-05 | AUTH-07 | Same reasoning — no reset endpoints, no reset screens. |

## 5. Implementation Areas

- **Data model/database changes** — D-01 (Invoice fields), D-02 (User store), D-03 (PasswordResetToken store).
- **Backend/business logic** — AUTH-01/02/06, RATE-01/02, EMAIL-01/02/03/04, PDF-01, OWN-01.
- **API/interface changes** — AUTH-05, AUTH-07, SEND-02, CONF-01, OWN-02 (route-level guards on existing endpoints).
- **UI changes** — UI-01 through UI-05.
- **PDF/export changes** — PDF-01 (refactor only; existing `/:id/pdf` output unchanged).
- **Validation** — SEND-01 (email format), P0-4-dependent password policy in AUTH-02/AUTH-07.
- **Error handling** — the 401/403/404/400/429/409/200-with-Failed envelope from `architecture.md` §8, implemented across AUTH-04/05/07, OWN-01/02, RATE-01/02, SEND-02, CONF-01.
- **Security** — AUTH-01 (hashing), AUTH-03/SEC-01 (session/CSRF), RATE-01/02 (server-side enforcement), SEC-02 (secrets audit).
- **Unit tests** — see §6.
- **Integration tests** — see §6.
- **Documentation/configuration** — F-02, DOC-01, DOC-02.

## 6. Testing Plan

| Test | Type | Covers | Depends On |
|---|---|---|---|
| Password hashing/verification correctness | Unit | AUTH-01 | AUTH-01 |
| Lockout threshold and 15-minute reset window | Unit | RATE-01 | RATE-01 |
| Send-rate-limit threshold and 1-hour window | Unit | RATE-02 | RATE-02 |
| Retry/backoff exhausts within 15s; dry-run never calls real SendGrid | Unit | EMAIL-02, EMAIL-01 | EMAIL-01, EMAIL-02 |
| Email-format validation: valid/invalid/missing addresses | Unit | SEND-01 | SEND-01 |
| Ownership filter/reject logic in isolation | Unit | OWN-01 | OWN-01 |
| PDF buffer output matches streamed output (regression) | Unit | PDF-01 | PDF-01 |
| **Happy path** — successful login | Integration | Scenario 8 | AUTH-05 |
| **Happy path** — successful send (Sent, `lastSentAt`, `sendCount`, `sendHistory` updated) | Integration | Scenario 1 | SEND-02 |
| **Happy path** — resend updates count/timestamp/history | Integration | Scenario 3 | SEND-02 |
| **Happy path** — password reset end-to-end | Integration | Scenario 10 | AUTH-07 |
| **Not Found** — invoice ID that doesn't exist on get/update/delete/send | Integration | Existing 404 behavior, preserved | OWN-02, SEND-02 |
| **Not Found / Forbidden** — invoice ID owned by another user | Integration | Scenario 11 | OWN-02 |
| **Missing fields** — send with missing/malformed `to.email` | Integration | Scenario 2 | SEND-01, SEND-02 |
| **Missing fields** — login/reset requests missing username/password/token | Integration | Baseline input validation | AUTH-05, AUTH-07 |
| **Invalid input** — reset with expired or already-used token | Integration | Scenario 10 (failure branch) | AUTH-07 |
| **Invalid input** — login with wrong credentials | Integration | Scenario 9 (pre-lockout) | AUTH-05 |
| **Edge case** — 6th login attempt while locked out | Integration | Scenario 9 | AUTH-05, RATE-01 |
| **Edge case** — 51st send within an hour | Integration | Scenario 12 | SEND-02, RATE-02 |
| **Edge case** — SendGrid unreachable, retries exhausted | Integration | Scenario 4 | SEND-02, EMAIL-02 |
| **Edge case** — dry-run mode simulates outcome without a real SendGrid call | Integration | Scenario 13 | SEND-02, EMAIL-01 |
| **Edge case** — edit/delete of a sent invoice without `confirm: true`, then with it | Integration | Scenario 6 | CONF-01 |
| **Integration** — unauthenticated request to any invoice/send route → 401; unauthenticated request to login/forgot/reset → reachable | Integration | Scenario 7 + regression guard for the P0-1 fix | AUTH-04, AUTH-05, AUTH-07 |
| **Integration** — delivery status/`lastSentAt` visible across a mixed-status invoice list | Integration | Scenario 5 | SEND-02, OWN-02 |

## 7. Definition of Done

- All four Phase 0 preconditions (P0-1..P0-4) are resolved and, where they affect `architecture.md`, that document has been updated and re-reviewed — not just decided verbally.
- Every task marked High priority in §2 is complete; every task marked Medium is complete or explicitly deferred with the product owner's sign-off.
- Every Acceptance Criteria scenario in `requirement.md` (Scenarios 1–13) has a passing corresponding test from §6.
- The existing `GET /:id/pdf` output is verified unchanged after the PDF-01 refactor (no regression).
- No secret (`SENDGRID_API_KEY`, `SESSION_SECRET`, sender identity) appears anywhere in the repository, including history for newly added files.
- All new server-side enforcement (session gate, ownership, lockout, rate limit) is verified to reject even when the UI is bypassed (e.g. via direct API calls), per NFR8/FR17.
- The `confirm: true` transport (CONF-01) and the CSRF baseline (SEC-01) have explicit sign-off recorded, not just a working implementation, per `design-review.md` §4.
- README/`.env.example` accurately describe every new environment variable and setup step needed to run the feature locally.
- No production code outside the scope of this story's FR/NFR list has been altered; no requirement beyond FR1–FR17/NFR1–NFR8 has been introduced.
