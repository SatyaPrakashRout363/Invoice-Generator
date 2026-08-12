# EPMCDME-14102 — Automated Invoice Email Delivery, Authentication & Per-User Ownership

Consolidated requirements produced through a business-analyst-style, one-question-at-a-time clarification process on the original User Story EPMCDME-14102. Scope grew from a simple "email an invoice" feature into email delivery + a full multi-user auth system + per-user invoice ownership, per an explicit decision to keep everything as a single story rather than splitting into linked tickets.

## Business Summary

Invoices are generated as PDFs but must currently be downloaded and sent manually by the user through their own email client. This enhancement adds a one-click "Send Invoice" action that emails the generated PDF directly to the client from within the app, tracks delivery status/history, and introduces the multi-user login and per-user invoice ownership needed to make sending invoices to real clients safe to expose.

## General Description

Add an email-delivery capability to the existing invoice workflow, backed by SendGrid. From the invoice list, a logged-in user can trigger "Send"/"Resend", which emails the already-implemented PDF to the client's email address on file, using a fixed application-level sender identity. Each invoice gains delivery metadata (status, last-sent timestamp, send count, and a full per-attempt send history) shown in the UI. Because this exposes real client-facing email sending and now-persistent account data, the app also gains: a login-gated whole-app boundary with manually-provisioned multi-user accounts, per-user invoice ownership (each user only sees/manages their own invoices), login lockout, and a SendGrid-backed password-reset flow.

## Business Value

Manual sending is slow, easy to forget, and leaves no record of whether a client actually received an invoice, which is a common driver of late payments and "I never got this" disputes. Automating delivery and tracking its status (with full history) shortens the cash-collection cycle, reduces support/admin overhead chasing unsent invoices, and gives an auditable record that an invoice was delivered. Adding real client-facing email sending also makes basic access control and per-user data separation a genuine business requirement rather than an optional nicety, since multiple people can now trigger real communications to real clients and need their own accounts and their own invoices. Complementary to (not overlapping with) EPMCDME-14099, which tracks whether an invoice was *paid* rather than whether/by whom it was *sent*.

## Problem Statement

Today, the only way to get an invoice to a client is to download the PDF and attach it manually outside the app; there is no record of whether/when/to whom it was sent, no retry on failure, and no resend without repeating the manual steps. Separately, the app currently has no authentication and no concept of separate users or ownership, which is not acceptable once the app can send real emails to real clients on someone's behalf and store their contact/send history.

## Preconditions

- The invoice must exist, have a valid client email address (`to.email`), and belong to the requesting logged-in user.
- A SendGrid account/API key is configured via environment variables.
- The requesting user has a valid, non-expired login session.

## Assumptions

- SendGrid is the transactional email provider for both invoice delivery and password-reset emails.
- One recipient email per invoice (`to.email`) is sufficient; CC/BCC is out of scope.
- User accounts are manually provisioned (no self-service sign-up) into a flat-file accounts store with hashed passwords.
- A small, trusted set of users justifies a long-lived (~30 day) session rather than short-lived sessions.
- The existing PDF generation logic in `api/routes/invoices.js` can be reused unchanged as the email attachment.

## Dependencies

- SendGrid API key and a verified sender identity (fixed app-level "From" address/name), configured via environment variables.
- A session/cookie mechanism (e.g. `express-session`) and a password-hashing library added to the API.
- Existing PDF generation logic (`computeTotals`, the `/:id/pdf` route) — reused, not modified.
- No dependency on EPMCDME-14099; independent, can ship in either order.

## Technical Feasibility

High, with materially more surface area than a pure email feature. Email delivery is additive (new `POST /invoices/:id/send` reusing existing PDF logic, piped into the SendGrid SDK, with retry-with-backoff bounded to a 15s total budget, plus a dry-run/sandbox mode for dev and testing). Auth and ownership are the larger addition: session-cookie login gating every route, a flat-file accounts store with hashed passwords, per-user filtering added to every invoice list/get/update/delete/send handler, login lockout (5 failed attempts / 15 min), and a SendGrid-backed password-reset flow (1-hour single-use token). No new datastore technology is required — flat-file JSON persistence is extended to accounts/sessions/reset-tokens, consistent with the app's existing style — but this is a meaningfully larger change than the original single-endpoint email feature.

## Risks

- Emails may land in spam/junk folders, giving a false sense that delivery succeeded when the client never saw it.
- Automatic retries add latency; must be tuned to fit the 15s total budget without feeling instant on failure.
- Flat-file JSON storage has no locking; concurrent writes (sends, session/account updates) could race (accepted for v1's expected small-scale usage).
- Storing client email addresses, full send history, and now user credentials/reset tokens meaningfully increases the personal/sensitive data footprint and the impact of a data leak.
- Retrofitting login + per-user ownership onto an app with no prior auth model is a larger, riskier change than the original story implied — existing manual test flows and any external integrations assuming open access will break.
- Password-reset and login-lockout logic are common sources of subtle security bugs (e.g. token reuse, timing attacks, lockout bypass) and warrant focused review/testing.

## Scenarios of Use

1. A logged-in user finishes creating an invoice and clicks "Send" instead of manually downloading and emailing the PDF.
2. A user resends an invoice because the client says they never received it, and sees the updated send count/timestamp.
3. A send fails; the system retries automatically within the 15s budget, then shows "Failed to send" with the ability to retry manually.
4. A user reviewing their invoice list sees at a glance which invoices have been sent and when.
5. A new team member is given a manually-provisioned account and logs in to see only their own invoices.
6. A user forgets their password, requests a reset, and receives a time-limited reset link by email.
7. A user mistypes their password 5 times and is locked out for 15 minutes before being able to try again.
8. A user attempts to edit or delete an invoice that was already sent and sees a warning before the change is applied.

## Functional Requirements

**Email delivery**

- FR1: `POST /invoices/:id/send` generates the invoice PDF and emails it via SendGrid to `invoice.to.email`, scoped to the requesting user's own invoice.
- FR2: Reject the send with a clear validation error if `to.email` is missing or not a well-formed email address, before calling SendGrid.
- FR3: Record on the invoice: `deliveryStatus` (Not Sent / Sent / Failed), `lastSentAt`, `sendCount`, and a `sendHistory` array (timestamp, outcome, error detail, triggering user) for every attempt.
- FR4: On failure, automatically retry with backoff; all attempts must complete or give up within the original 15-second budget before marking Failed. Users can still manually trigger "Resend" afterward.
- FR5: The UI exposes "Send"/"Resend" actions and displays current `deliveryStatus` and `lastSentAt` (no dedicated send-history UI in this story).
- FR6: If an invoice has `deliveryStatus` other than "Not Sent", editing or deleting it shows a confirmation warning before the action proceeds (not blocked).
- FR7: The email is HTML-formatted, includes invoice number/total/due date alongside the PDF attachment, and is sent from a fixed, application-configured sender address/name.
- FR8: Sends are capped at 50 per user per hour; requests beyond that limit are rejected with a clear error and do not change `deliveryStatus`.
- FR9: An environment-controlled dry-run/sandbox mode simulates sends (success/failure) without calling the real SendGrid API, for use in development and automated tests.

**Authentication & accounts**

- FR10: Every API route requires a valid logged-in session; unauthenticated requests are rejected (401) and the UI redirects to a login screen.
- FR11: Login authenticates username/password against a manually-provisioned, flat-file accounts store with hashed passwords.
- FR12: Successful login issues a server-side session cookie valid for approximately 30 days.
- FR13: After 5 consecutive failed login attempts for a username, further attempts for that username are rejected for 15 minutes.
- FR14: A "forgot password" flow lets a user request a reset by username/email; the system emails (via SendGrid) a single-use link/token valid for 1 hour, following which the user can set a new password.
- FR15: There is no self-service registration; new accounts are added directly to the accounts store by whoever administers the app.

**Invoice ownership**

- FR16: Every invoice has an owning user (its creator); list/get/update/delete/send operations only operate on the requesting user's own invoices.
- FR17: A request to view, edit, delete, or send an invoice owned by a different user is rejected (403/404), not just hidden in the UI.

## Non-Functional Requirements

- NFR1: Email sending (including retries) is asynchronous and does not block the Express event loop.
- NFR2: All secrets (SendGrid API key, session secret) are supplied via environment variables only, never committed to the repository.
- NFR3: A send attempt, including any automatic retries, completes or fails within 15 seconds total; the UI reflects the result without a manual page refresh.
- NFR4: Delivery status, send history, account, and session data persist across API restarts.
- NFR5: Passwords are stored hashed (never in plaintext) using an industry-standard algorithm.
- NFR6: Session cookies are httpOnly (and marked secure when served over HTTPS) to reduce session-theft/XSS risk.
- NFR7: Password-reset tokens are single-use and expire after 1 hour.
- NFR8: Login lockout (5 attempts / 15 min) and send rate limiting (50/user/hour) are enforced server-side, not only in the UI.

## Edge Cases

- Recipient email missing or malformed → rejected before any SendGrid call (FR2).
- SendGrid outage/timeout → automatic retries within the 15s budget, then Failed with a retry option.
- Two overlapping send requests for the same invoice (e.g. double-click) → both proceed independently; no in-progress lock in this story (accepted risk, see Risks).
- Editing/deleting an invoice that has already been sent → confirmation warning shown, action still allowed if confirmed.
- A user attempts to access another user's invoice by ID → rejected (403/404), regardless of UI state.
- 5 consecutive failed logins for a username → locked out for 15 minutes.
- An expired or already-used password-reset token → rejected with a clear error; user must request a new reset.
- A user exceeds 50 sends in an hour → further sends rejected with a clear error until the window resets.
- Dry-run/sandbox mode enabled → sends are simulated (no real email delivered) but still update `deliveryStatus`/history as if real, clearly distinguishable in logs.

## Related Work

Distinct from and complementary to EPMCDME-14099 (payment-status/overdue tracking) — that story tracks whether an invoice has been *paid*; this story tracks whether/by whom it has been *sent*, and (as a result of requirements analysis) who is allowed to see and send it in the first place.

## Acceptance Criteria (Given / When / Then)

**Scenario 1: Successful send**
Given a logged-in user's invoice has a valid, well-formed recipient email address
When the user clicks "Send"
Then the system emails the HTML invoice (with PDF attached) via SendGrid from the fixed app sender, sets `deliveryStatus` to "Sent", records `lastSentAt`, increments `sendCount`, and appends a success entry to `sendHistory`

**Scenario 2: Missing or malformed recipient email**
Given an invoice has no recipient email address, or one that is not well-formed
When the user clicks "Send"
Then the system rejects the request with a clear validation error before calling SendGrid, and `deliveryStatus` is unchanged

**Scenario 3: Resend after initial send**
Given an invoice has already been sent at least once
When the user clicks "Resend"
Then the system sends again, updates `lastSentAt`, increments `sendCount`, and appends a new entry to `sendHistory`

**Scenario 4: Delivery failure with automatic retry**
Given the SendGrid API is unreachable or returns an error
When the user clicks "Send"
Then the system automatically retries with backoff within the original 15-second budget; if all retries fail, `deliveryStatus` is set to "Failed", the error is surfaced in the UI, and the user can manually retry via "Resend"

**Scenario 5: Visibility of delivery status**
Given invoices with varying delivery states (Not Sent, Sent, Failed)
When the user views their invoice list
Then each invoice displays its current `deliveryStatus` and, if applicable, `lastSentAt`

**Scenario 6: Editing a sent invoice**
Given an invoice has `deliveryStatus` other than "Not Sent"
When the user attempts to edit or delete it
Then the UI shows a confirmation warning that the invoice was already sent to the client, and only proceeds if the user confirms

**Scenario 7: Unauthenticated access is blocked**
Given a request has no valid session
When it hits any invoice or send API route
Then the system responds 401 and the UI redirects to the login screen

**Scenario 8: Successful login**
Given a manually-provisioned account with a known username/password
When the user submits correct credentials
Then the system issues a session cookie valid for approximately 30 days and grants access to the app

**Scenario 9: Login lockout**
Given 5 consecutive failed login attempts for the same username
When a 6th attempt is made within the lockout window
Then the system rejects it and reports the account as temporarily locked, for 15 minutes from the 5th failure

**Scenario 10: Password reset**
Given a user requests a password reset for their username/email
When they follow the emailed reset link within 1 hour
Then they can set a new password; the token cannot be reused, and a token used after 1 hour is rejected with a clear error

**Scenario 11: Per-user invoice isolation**
Given two different users each have their own invoices
When user A requests a list, get, update, delete, or send operation on an invoice owned by user B
Then the system rejects the request (403/404) regardless of the invoice ID being known

**Scenario 12: Send rate limit**
Given a user has already triggered 50 sends within the past hour
When they attempt a 51st send
Then the system rejects the request with a clear rate-limit error and does not change `deliveryStatus`

**Scenario 13: Dry-run mode**
Given the environment has dry-run/sandbox mode enabled
When a send is triggered
Then the system simulates the outcome (success/failure) without calling the real SendGrid API, while still updating `deliveryStatus`/`sendHistory` as it would for a real send

## Status

This document reflects the fully clarified requirements. **No implementation code has been written yet.** Next step (pending go-ahead) is to implement against these requirements and/or update the live Jira ticket EPMCDME-14102 to match.
