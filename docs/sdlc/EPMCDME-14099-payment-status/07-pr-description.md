# PR Description — EPMCDME-14099 (payment-status)

Source: [PR #2](https://github.com/SatyaPrakashRout363/Invoice-Generator/pull/2), branch `feature/payment-status`. Reproduced verbatim from the actual PR body (title/changelog preamble and the trailing draft-file note stripped; the 5 required sections are unchanged).

**PR title:** Enhancement: payment-status + audit log, scheduler, and admin status API (prototype)

**Changelog entry:** Add paymentStatus/partial to invoices, file-based audit log, overdue scheduler, admin-only status API, and integration tests (Jest). Prototype storage uses JSON files; production plan recommends Postgres audit table and partitioning.

## Summary
This change implements the payment-status prototype: invoices gain `paymentStatus` and `partial` fields (defaulting to `Unpaid`), a file-backed `audit_log` is added, a scheduler marks unpaid invoices Overdue after a 15-day grace period, and an Admin-only PATCH endpoint records manual status changes (with audit entries). This prototype implements the requirements and tests to validate behavior while documenting production migration and operational recommendations.

## Changes Made
- api/routes/invoices.js — Added `paymentStatus`, `partial`, and `version` on creation; preserved status on PUT; added Admin-only `PATCH /:id/status` that updates status, increments `version`, and writes an audit entry. Also added debug logs for creation/audit.
- api/utils/store.js — Added file-backed audit helpers: `readAuditLog`, `writeAuditLog`, `appendAudit`. Audit stored at `api/data/audit_log.json`.
- api/scheduler/markOverdue.js — New scheduler script that marks Unpaid invoices Overdue after the 15-day grace period and appends audit entries (adminUserId = 'system').
- api/data/audit_log.json — Initial audit log file (empty array) for prototype storage.
- api/package.json — Added `test` script and dev dependencies (`jest`, `axios`) to run integration tests.
- api/test/api.test.js — Integration tests (Jest + axios) verifying invoice creation defaults to `Unpaid`, 404/400 behaviors, Admin-only status patch returns 403 for non-admin and writes audit on Admin change.
- api/test/markOverdue.test.js — Integration test verifying scheduler marks invoices Overdue and writes audit entries (waits for running API).
- ui/playwright.config.cjs and ui/tests/e2e.spec.js — Playwright E2E test and config (UI e2e test expects API and UI servers to be running; test attempts were made but environment spawn limitations prevented full run here).
- ui/package.json — Test script and Playwright deps added to support UI e2e; note: Vite scripts already present; Playwright config added.

## Test Evidence
API tests (actual run output):
- Command executed:
  - `cd api && npm.cmd test --silent`
- Last captured output:
  ```
  PASS  test/markOverdue.test.js
  PASS  test/api.test.js

  Test Suites: 2 passed, 2 total
  Tests:       6 passed, 6 total
  Snapshots:   0 total
  Time:        1.112 s, estimated 437 s
  Ran all test suites.
  ```

UI E2E (Playwright) test attempts (actual run output / failures):
- Playwright runs were attempted multiple times in this environment. The notable captured failures are:
  - Error variant: spawn EINVAL / spawn node ENOENT — caused by attempting to spawn `npm`/`node` from the test harness in this constrained environment.
  - After starting the API and Vite servers manually and re-running Playwright, run failed with:
    `Error: Timeout waiting for http://localhost:5173/`

## Known Limitations
- Secrets: `.mcp.json` contains Jira API token — must be removed and rotated immediately (CRITICAL).
- Auth: placeholder header-based auth (`x-user-role`, `x-user-id`) used for Admin checks; not production-safe. Real server-side auth (JWT/OIDC) must be integrated before production use.
- Audit storage: prototype uses JSON-file `api/data/audit_log.json` — not durable/scalable. Implementation plan recommends Postgres `audit_log` table with partitioning and retention.
- Audit-query API: Not yet implemented (GET /audit with filters is required by requirements but missing in prototype).
- Optimistic locking: `version` is added but not enforced on status endpoints (no 409 handling) — this must be added to prevent lost updates.
- Concurrency & atomicity: File-based writes are not atomic at scale; a DB-backed solution is required for production (transactions).
- UI E2E: Playwright tests failed in this environment due to spawn/timeouts; they are present and runnable locally but not green here.

## Reviewer Checklist
- [ ] Requirements reviewed
- [ ] Architecture reviewed
- [ ] Design review completed
- [ ] Implementation reviewed
- [ ] Unit tests reviewed
- [ ] Integration tests reviewed
- [ ] Security considerations reviewed
- [ ] Error handling reviewed
- [ ] Known limitations understood
- [ ] Verification completed
