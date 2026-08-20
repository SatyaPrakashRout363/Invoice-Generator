# Step 6: Review — EPMCDME-14102 (invoice email delivery, auth, ownership)

Review findings below are drawn directly from the "Known Limitations" already identified in [PR #3](https://github.com/SatyaPrakashRout363/Invoice-Generator/pull/3)'s description, mapped onto the standard review checklist. No new issues were invented; this document organizes what the implementer already disclosed.

## Correctness
- Login-lockout, send-rate-limiting, ownership filtering, dry-run email send, and reset-token lifecycle are all covered by passing unit tests (11/11).
- The design-review's one required fix — auth routes (`login`/`forgot-password`/`reset-password`) must not sit behind `requireSession` — is implemented; only `logout` requires a session.
- **`PUT /:id` overwrite risk:** the update handler spreads the full request body onto the stored invoice, protecting only `id`/`ownerId`. A client resubmitting a stale invoice object could silently overwrite server-tracked fields (`deliveryStatus`/`sendCount`/`sendHistory`/`lastSentAt`). The `409 confirmation_required` guard on already-sent invoices still fires correctly and independently of this.

## Security
- Passwords hashed with bcrypt; reset tokens are single-use with a 1-hour expiry — both unit-tested.
- Session cookies are httpOnly, `SameSite=Lax`, and `secure` in production.
- Ownership checks return 404 (not 403) for both "not found" and "belongs to another user," per architecture.md's design decision to avoid confirming existence to an unauthorized caller.
- Real email delivery depends on a valid `SENDGRID_API_KEY`; not exercised against live SendGrid, only via dry-run mode and a simulated-failure test.

## Error Handling
- 401 returned for any invoice-route request without a valid session (`requireSession` middleware).
- 409 `confirmation_required` guard on `PUT`/`DELETE` for already-sent invoices.
- **Gap:** no unit test for route-level "missing required field" validation (create-invoice, login, reset-password) or for the recipient-email-format regex in isolation.

## Test Coverage
- Strong unit-level coverage (11/11 passing) across auth, email, ownership, rate-limiting.
- **No integration/end-to-end tests exist.** All 13 Acceptance Criteria scenarios in `01-requirements.md` are implemented and verified by code inspection only — this does not meet `04-impl-plan.md`'s own Definition of Done.

## Code Clarity
- PDF-building logic was extracted into `api/utils/pdf.js` specifically so it can be reused for both HTTP streaming and email-attachment buffer generation — a deliberate, documented refactor rather than duplication.

## DRY
- New `userStore.js`/`resetTokenStore.js` flat-file stores mirror the existing `store.js` pattern rather than introducing a new persistence approach.

## Dependency Safety
- `npm audit` on `api/`: 1 high + 1 critical advisory via `tar`, reached transitively through `bcrypt`'s native-module build tooling (`@mapbox/node-pre-gyp`) — confirmed not reachable through the app's runtime/HTTP surface. Fixable via `npm audit fix`, not yet applied.
- `npm audit` on `ui/`: 0 vulnerabilities.
- No lint/static-analysis tool is configured for the API package (UI has `oxlint`, clean).

## Summary
Solid unit-level implementation with real security-conscious choices (bcrypt, single-use tokens, 404-not-403 ownership checks, confirmation guard on sent invoices). The two highest-priority gaps before production are the complete absence of integration/E2E test coverage against the story's own 13 acceptance criteria, and the `PUT /:id` overwrite risk on server-tracked fields.
