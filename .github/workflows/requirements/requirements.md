# Final Requirements

## Story Reference
- Jira project: `EPMCDME`
- Find the story whose description begins with: "Enhance Invoice Generator"
- Created enhancement issue (reference): `EPMCDME-14099`

## Decisions & Business Rules
- Payment statuses supported: `Paid`, `Unpaid`, `Overdue`, `Partial`, `Canceled`, `Refunded`.
- New invoices default to `Unpaid`.
- `Overdue` is applied automatically after a grace period of **15 days** past the due date.
- `Partial` is a boolean flag only (no partial-amount tracking).
- Admins only may manually change payment status.
- Manual status change must create an audit entry.

## Audit Requirements
- Audit entry contents: previous status, new status, admin user id, timestamp (UTC), optional reason.
- Audit storage: separate audit log (separate collection/table), not embedded inside invoice records.
- Audit retention: **7 years**; older entries must be purged or archived per retention policy.
- Audit visibility: viewable by `Admin` role only.

## Functional Requirements
- Data model:
  - Add `paymentStatus` field to invoice (enum/string).
  - Add `partial` boolean flag (true when `Partial`).
  - No changes required for invoice amount fields for `Partial` (per decision).
- Backend behavior:
  - On invoice creation, set `paymentStatus = "Unpaid"`.
  - Daily scheduled job (or cron) checks invoices where `paymentStatus = "Unpaid"` and `dueDate + 15 days < now` → set to `Overdue` and write audit entry.
  - Endpoint(s) to update `paymentStatus` (Admin-only). Update must validate role and write audit entry containing previous status, new status, admin id, timestamp, and optional reason.
  - API to query audit log entries (Admin-only) with filters: invoiceId, date range, admin user.
- Frontend behavior:
  - Invoice creation UI should not expose `paymentStatus` to non-admins (defaults to `Unpaid`).
  - Invoice list view must display `paymentStatus` and `Partial` flag.
  - PDF export must include `paymentStatus` and `Partial` designation.
  - Admin UI must allow manual status change with optional reason input and display audit history for an invoice.

## Acceptance Criteria
- New invoice created via API/UI has `paymentStatus = Unpaid`.
- After 15 days past due date, unpaid invoices are automatically set to `Overdue` by scheduled job, and audit entry is created.
- Admin can change status manually via UI/API; change is recorded in audit log with required fields.
- Audit log is stored separately and retained for 7 years; Admin can view audit entries.
- Invoice list and PDF include the payment status and partial flag.

## Edge Cases & Clarifications
- If an invoice is back-dated or dueDate is changed, the scheduled job uses the current `dueDate` and recalculates overdue condition.
- When status changes from `Overdue` to `Paid` (automatically or manually), audit entry is created.
- Concurrent updates: backend must handle concurrent status updates with optimistic locking or transactions to prevent lost updates to `paymentStatus`.
- Migration: existing invoices without a `paymentStatus` must be treated as `Unpaid` after migration.

## Non-Functional Requirements
- Scheduled job should be low-latency and safe for large invoice datasets (batch updates, pagination).
- Audit queries should be indexable by `invoiceId` and `timestamp` to support fast searches.
- All timestamps stored in UTC.
- Access control must be enforced server-side for all audit and status-change operations.

## Implementation Notes / Next Steps
1. Confirm the Jira story `EPMCDME-14099` contains these acceptance criteria; update Jira description if needed.
2. Update backend `api/`:
   - Add `paymentStatus` and `partial` fields to invoice model.
   - Implement scheduled job to mark Overdue after 15 days.
   - Implement audit log storage and endpoints.
3. Update frontend `ui/src/`:
   - Show `paymentStatus` and `Partial` in list and PDF export.
   - Add Admin UI for manual status changes and audit viewing.
4. Write unit and integration tests for scheduled job, status updates, audit logging, and access control.
5. Data migration: backfill missing `paymentStatus` with `Unpaid`.

---

Document generated from analysis and clarified requirements on 2026-08-12.
