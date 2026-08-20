# Design Review: Invoice Payment-Status Enhancement

Date: 2026-08-12
Reviewer: Senior Architect

## Summary
A structured review of `.github/workflows/architecture/Architecture.md` focusing on risks, gaps, mitigations, and agreed design decisions for the payment-status enhancement (EPMCDME-14099).

## Key Findings (Risks & Gaps)
1. Scaling the audit store: a single Postgres `audit_log` table will grow significantly over 7 years and may impact query performance if not partitioned or archived.
2. Scheduler scalability: running a daily batch against large invoice tables may cause long-running transactions and lock contention if not carefully batched.
3. Failure semantics: the design lacks explicit failure/retry behavior for audit writes and scheduled job partial-failure handling.
4. Consistency during concurrent updates: optimistic locking is mentioned, but there is no explicit strategy for conflict resolution or user feedback when update fails due to concurrent change.
5. Backup/retention automation: retention for 7 years requires automated archival/purge — the document mentions it but not implementation details (partitioning, archive jobs, regulatory export).
6. Security and compliance: audit data contains sensitive operational metadata — encryption at rest and RBAC enforcement details are not explicit.
7. Observability: limited detail on monitoring, alerting thresholds for scheduler failures, or audit log growth alerts.
8. Migration strategy: backfill plan is brief; missing migration window, rollback strategy, and performance impact mitigation.

## Recommendations / Mitigations
- Audit storage:
  - Partition `audit_log` by year (or month for high-volume), add indexes on `(invoice_id, created_at)`; implement an archival job to move >7y rows to an archive schema or object storage.
- Scheduler:
  - Implement keyset-pagination and small batch sizes (e.g., 1000 rows per batch) with short transactions; use a cursor and process idempotently.
  - Use a queue (Redis/BullMQ) to push update tasks for async processing when marking Overdue at scale.
- Reliability:
  - Add retry with exponential backoff for audit writes; use an at-least-once approach but ensure idempotency (audit entries can use UUIDs or dedup keys).
  - On partial failure, log failed invoice IDs and retry; alert when retry threshold exceeded.
- Concurrency:
  - Implement optimistic locking using a `version` column and return clear HTTP 409 on conflict; provide UI messaging to retry.
- Retention & Compliance:
  - Automate retention via partition drop or archival to S3 with controlled access; encrypt archived data.
- Security:
  - Encrypt audit data at rest, restrict access to audit APIs to Admin role, and log audit access events.
- Observability:
  - Add metrics: `scheduled_job_duration`, `scheduled_job_failures`, `audit_log_size_bytes`, `audit_write_failures` and set alerts.
- Migration:
  - Run backfill on staging with production-sized dataset; perform backfill in small batches during off-peak; provide a rollback script to restore previous state.

## Agreed Design Decisions (to record in architecture)
- Use Postgres with partitioned `audit_log` and retention job to meet 7-year retention.
- Scheduler will use keyset pagination and an optional queue for write amplification control.
- Store audit entries in separate `audit_log` table with indexes and encryption at rest.
- Admin-only RBAC for audit viewing and manual status changes; server-side enforcement.
- Implement optimistic locking with 409 responses and UI-friendly retry guidance.

## Action Items
1. Update `Architecture.md` to include a `Risks & Mitigations` section and the agreed decisions (done alongside this review).
2. Add DB partitioning and archival details to implementation notes.
3. Define SLOs and monitoring thresholds for scheduled job and audit pipeline.
4. Implement migration runbook with batch size recommendations and rollback steps.

## Next Steps
- Product owner / Tech lead to confirm compliance requirements for audit retention and encryption.
- Devs to implement partitioning and scheduler batching before wide rollout.
- QA to add integration tests simulating concurrent status updates and scheduled job runs.


Document created and stored at `.github/workflows/Design/design-review.md`.
