# Implementation Plan

## Overview
This plan implements the payment-status enhancement described in `.github/workflows/requirements/requirements.md` and the architecture in `.github/workflows/architecture/Architecture.md`.
Goals:
- Add `paymentStatus` and `partial` to invoices
- Implement scheduled job to mark Overdue after a 15-day grace period
- Add a separate, partitioned `audit_log` with 7-year retention and Admin-only access
- Provide API and UI changes for Admin manual status changes and audit viewing

## Task Breakdown

- Task ID: IMP-001
  - Description: Add DB columns `payment_status` (enum) and `partial` (boolean) and `version` (int) to the `invoices` table; create `audit_log` table schema
  - Priority: High
  - Dependencies: None
  - Blocked By: Migration window confirmation (see Missing Info)
  - Expected Outcome: DB schema ready (columns created, audit_log table exists), migration scripts skeleton prepared

- Task ID: IMP-002
  - Description: Implement DB partitioning for `audit_log` (partition by year) and indexes on `(invoice_id, created_at)`; retention/archival plan (move >7y to archive schema or S3)
  - Priority: High
  - Dependencies: IMP-001
  - Blocked By: Storage access for archive (S3 or equivalent) if chosen
  - Expected Outcome: Partitioned audit_log with retention job scheduled

- Task ID: IMP-003
  - Description: Write DB migration/backfill scripts to set `payment_status='Unpaid'` for existing invoices and populate `version` values; include rollback scripts
  - Priority: High
  - Dependencies: IMP-001
  - Blocked By: Maintenance window approval and staging verification
  - Expected Outcome: Safe backfill & rollback scripts ready and tested in staging

- Task ID: IMP-004
  - Description: Implement PaymentStatus business logic module in backend (Node/Express): state transitions, validation, write audit entries
  - Priority: High
  - Dependencies: IMP-001, IMP-003 (schema + backfill recommended before production use)
  - Blocked By: DB schema deployment (IMP-001)
  - Expected Outcome: Module encapsulates defaulting to `Unpaid`, transition rules, and audit-write API

- Task ID: IMP-005
  - Description: Implement scheduled job (daily) to find unpaid invoices past `due_date + 15 days` using keyset pagination and mark them `Overdue` (batching); produce audit entries for each update
  - Priority: High
  - Dependencies: IMP-001, IMP-004
  - Blocked By: Approval of scheduler runtime (cron vs k8s CronJob) and resource allocation
  - Expected Outcome: Reliable, batched scheduled job with monitoring and retry on failures

- Task ID: IMP-006
  - Description: Implement API endpoint(s): PATCH `/invoices/:id/status` (Admin-only) and GET `/audit?invoiceId=&from=&to=&admin=` (Admin-only)
  - Priority: High
  - Dependencies: IMP-004
  - Blocked By: Auth integration details (scope/role names)
  - Expected Outcome: Endpoints with server-side RBAC, optimistic locking (version), and proper error responses (HTTP 409 on conflict)

- Task ID: IMP-007
  - Description: Add server-side RBAC enforcement for Admin-only actions in API (middleware changes to check role)
  - Priority: High
  - Dependencies: IMP-006
  - Blocked By: Auth provider mapping and role names confirmation
  - Expected Outcome: Admin-only endpoints secured; non-admins receive 403

- Task ID: IMP-008
  - Description: Implement audit writer: idempotent writes with retries/exponential backoff; include dedup keys for idempotency
  - Priority: High
  - Dependencies: IMP-001, IMP-004
  - Blocked By: None
  - Expected Outcome: Resilient audit writes and clear failure logging/alerting

- Task ID: IMP-009
  - Description: Frontend UI: show `paymentStatus` and `Partial` in invoice list; update invoice detail view to show audit history (Admin-only), and Admin UI to change status with optional reason
  - Priority: Medium
  - Dependencies: IMP-006, IMP-007, IMP-008
  - Blocked By: API endpoints readiness
  - Expected Outcome: UI displays status and allows Admin status change and viewing audit entries

- Task ID: IMP-010
  - Description: PDF export changes to include `paymentStatus` and `Partial` flag in exported PDFs
  - Priority: Medium
  - Dependencies: IMP-004, IMP-009
  - Blocked By: UI/Backend contract for PDF data model
  - Expected Outcome: PDF shows payment status and partial flag

- Task ID: IMP-011
  - Description: Input validation and error handling: validate status transitions, reject invalid data, return structured error messages
  - Priority: High
  - Dependencies: IMP-004, IMP-006
  - Blocked By: None
  - Expected Outcome: Robust validation and clear client-facing errors

- Task ID: IMP-012
  - Description: Unit tests: backend module tests for PaymentStatus logic, audit writer, scheduler; frontend unit tests for new UI components
  - Priority: High
  - Dependencies: IMP-004, IMP-005, IMP-008, IMP-009
  - Blocked By: Implementation of corresponding modules
  - Expected Outcome: Unit test coverage for new logic

- Task ID: IMP-013
  - Description: Integration tests: end-to-end tests for creating invoice -> scheduled overdue transition; Admin manual change -> audit entry; concurrent update conflict handling
  - Priority: High
  - Dependencies: IMP-003, IMP-004, IMP-005, IMP-006
  - Blocked By: Test environment with DB schema and scheduler configured
  - Expected Outcome: Integration tests validating system behavior

- Task ID: IMP-014
  - Description: Monitoring & Alerts: add metrics (scheduled_job_duration, scheduled_job_failures, audit_write_failures, audit_log_size_bytes) and alerts
  - Priority: Medium
  - Dependencies: IMP-005, IMP-008
  - Blocked By: Monitoring platform access/configuration
  - Expected Outcome: Operational visibility and alerts

- Task ID: IMP-015
  - Description: Documentation and runbook: migration runbook, scheduler operational playbook, audit retention policy, admin user guide for manual status changes
  - Priority: Medium
  - Dependencies: IMP-001..IMP-010
  - Blocked By: Finalized implementation details
  - Expected Outcome: Documentation ready for operators and devs

- Task ID: IMP-016
  - Description: Data retention job: implement archival/purge job to move >7y audit entries to archive storage and purge from primary store
  - Priority: Medium
  - Dependencies: IMP-002
  - Blocked By: Archive storage account/config
  - Expected Outcome: Automated 7-year retention enforcement

- Task ID: IMP-017
  - Description: Migration verification & production rollout (staged): execute migration in staging, run backfill, run tests, schedule production migration window
  - Priority: High
  - Dependencies: IMP-003, IMP-012, IMP-013, IMP-015
  - Blocked By: Stakeholder sign-off and maintenance window
  - Expected Outcome: Safe rollout plan and execution

## Dependency Order
Order tasks so prerequisites are implemented first:
1. IMP-001 (DB schema)
2. IMP-002 (Partitioning) — follow IMP-001
3. IMP-003 (Backfill scripts)
4. IMP-004 (PaymentStatus business logic)
5. IMP-008 (Audit writer implementation)
6. IMP-005 (Scheduler implementation)
7. IMP-006 (API endpoints)
8. IMP-007 (RBAC enforcement)
9. IMP-009 (Frontend UI changes)
10. IMP-010 (PDF export changes)
11. IMP-011 (Validation & error handling)
12. IMP-012 (Unit tests)
13. IMP-013 (Integration tests)
14. IMP-014 (Monitoring & alerts)
15. IMP-015 (Documentation & runbook)
16. IMP-016 (Retention job)
17. IMP-017 (Migration verification & rollout)

## Blocked Tasks
- IMP-001: Blocked by migration window confirmation for production schema change (needs ops/owner approval).
- IMP-002 / IMP-016: Blocked by archive storage/account details to implement archival pipeline (S3 credentials / policy).
- IMP-006 / IMP-007: Blocked by auth provider mapping (role names) and token validation contract.
- IMP-003 / IMP-017: Blocked by staging environment with production-like data or stakeholder sign-off for running backfill.

## Testing Plan
- Unit Tests:
  - `PaymentStatus` state machine tests (valid/invalid transitions)
  - `AuditWriter` idempotency and retry logic tests
  - Scheduler logic tests using fake time (short grace period)
- Integration Tests:
  - E2E: create invoice -> scheduled job sets `Overdue` after simulated 15 days -> audit entry exists
  - Admin flow: Admin changes status -> audit entry created and retrievable
  - Concurrency test: concurrent PATCH status -> one succeeds, other receives 409
- Test Environment:
  - Use a Postgres test DB with partitioning enabled for integration tests; run scheduler in test mode with reduced batch sizes

## Definition of Done
- Database schema changes applied and verified in staging with rollback scripts.
- Backfill completed in staging and validated.
- PaymentStatus module implemented with unit tests passing.
- Scheduler runs reliably, marking overdue invoices and creating audit entries.
- API endpoints implemented with RBAC and optimistic locking; API docs updated.
- Frontend displays `paymentStatus` and `Partial`; Admin UI for status change and audit view implemented and tested.
- PDF exports include payment status.
- Integration tests pass in CI; monitoring/alerts in place for scheduled job failure and audit-write issues.
- Retention job implemented or scheduled; documentation and runbooks completed.

## Missing Information (needs clarification before implementation)
- Exact auth provider and role claim names for Admin role (used to enforce RBAC).
- Production maintenance window and approved migration process for backfill.
- Archive storage selection and credentials for audit archival (S3 or alternative).
- Confirmation of primary DB (Postgres recommended by architecture — confirm with infra team).
- SLOs/alert thresholds for scheduler failures and audit pipeline (e.g., maximum acceptable failure rate)
