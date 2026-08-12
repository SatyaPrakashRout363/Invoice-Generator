# Design Review — EPMCDME-14102

Reviewed artifacts: `.claude/skills/requirement/requirement.md` (FR1–FR17, NFR1–NFR8) and `.claude/skills/architecture/architecture.md`. Cross-checked against the current repository state (`api/routes/invoices.js`, `api/utils/store.js`, `api/utils/totals.js`, `api/server.js`, `api/package.json`, `ui/src/App.jsx`, `ui/src/api.js`, `ui/package.json`). No production code was modified to produce this review, and `architecture.md` was not edited.

## 1. Traceability (requirement.md → architecture.md)

All 17 functional requirements and 8 non-functional requirements trace to a named component, data-flow step, or data-model field in `architecture.md`:

| Requirement | Architecture coverage |
|---|---|
| FR1–FR9 (email delivery) | §2 Email Service, §4.2 Send Invoice flow, §5 Invoice model, §6 `POST /invoices/:id/send` |
| FR10 (session-gated routes) | §2 Session Middleware, §6, §8 |
| FR11–FR12 (login, session cookie) | §4.1 Login flow, §5 User/Session models |
| FR13 (lockout) | §2 Rate Limit/Lockout Guard, §4.1, §5, §8 |
| FR14 (password reset) | §2 Auth Service, §4.4, §5 PasswordResetToken |
| FR15 (no self-registration) | Correctly *not* designed — provisioning mechanism deferred to §12 as an open question rather than invented |
| FR16–FR17 (ownership) | §2 Ownership Middleware, §4.5, §5 `ownerId`, §8 |
| NFR1–NFR8 | §9, §10 respectively; NFR4's silence on lockout/rate-limit persistence is explicitly and correctly caught in §12 |

`sendHistory` fields in §5 (`timestamp`, `outcome`, `error`, `triggeredBy`) match FR3's wording exactly. No requirement is undesigned; no component in `architecture.md` is invented without a requirement behind it. Traceability is clean.

One positive finding worth calling out rather than treating as a gap: FR16/FR17 only say "list/get/update/delete/send," but §6 extends session + ownership scoping to `GET /:id/pdf` as well. That route isn't named in the FRs, but leaving it open would have been a real hole (anyone with an invoice ID could pull another user's PDF unauthenticated). Good judgment call, not scope creep.

## 2. Architecture Evaluation

- **Modular monolith, flat-file persistence retained** — consistent with requirement.md's Technical Feasibility section, which explicitly says no new datastore is warranted at this scale. Appropriate; not over-engineered.
- **New dependencies are minimal and justified** (`express-session`, a file-backed session store, `bcrypt`, `@sendgrid/mail`) — each maps to a specific FR/NFR, no speculative additions. Verified against current `api/package.json`, which has none of these yet, so the doc's "no code written" status is consistent with reality.
- **Email Service reused for both invoice-send and password-reset** — good DRY call, avoids two retry/backoff implementations.
- **PDF Generator refactor** (extract pdfkit logic into a function usable for both HTTP stream and Buffer) is grounded correctly against the actual `invoices.js` — the existing `/:id/pdf` handler really does build the PDF inline via `pdfkit`, so this refactor is real and necessary, not hypothetical.
- **Confirmation-on-edit-of-sent-invoice mechanic** (§4.3/§6: 409 + `confirm: true`) is a concrete design commitment beyond what requirement.md specifies (it specifies behavior, not transport). §12 correctly flags this as invented rather than pretending it's a business rule — but see §4 below, it needs explicit sign-off, not just a footnote.
- **In-memory lockout/rate-limit counters** — correctly scoped as a single-process constraint and flagged as a scaling limitation in §10/§12 rather than silently assumed.

## 3. Risks / Gaps

**Defect — auth-route diagram contradicts the login flow (must fix).**
§3's Mermaid diagram draws `AuthMW --> AuthRoutes`, i.e. the `requireSession` gate sits in front of the Auth Routes (login/logout/forgot-password/reset-password). Taken literally, this is circular: you cannot obtain a session by calling `POST /auth/login` if reaching that route first requires an existing valid session. This directly contradicts §4.1's own prose ("UI submits username/password to `POST /auth/login`" — no session precondition stated) and Scenario 7 in requirement.md, which scopes the 401-if-no-session rule to "any invoice or send API route," not auth routes. The text is correct; the diagram is wrong. This is the kind of inconsistency that would either block login entirely if implemented as literally diagrammed, or force an implementer to silently deviate from the documented architecture — neither is acceptable to ship as-is.

**Gap — CSRF is parked as an open question, but the risk profile changed underneath it.**
§12 flags CSRF as unaddressed, which is honest, but this story is what introduces cookie-based sessions to an app that previously had none, and it now guards real client-facing email sends. "Open question for the security review" undersells it — at minimum a `SameSite` cookie attribute decision should be made explicitly before implementation, not left to whoever writes the session-cookie config line.

**Minor — `sendHistory` has no bound.**
Every send/resend appends an entry; nothing in the data model (§5) or NFRs caps growth. Not a defect against requirement.md (which doesn't ask for pruning) but worth a one-line note so it isn't rediscovered as a "bug" later at an invoice with hundreds of resends.

**Minor — Ownership Middleware's role on `POST /` (create) is unstated.**
§2 describes Ownership Middleware as filtering/rejecting on existing invoices; §6 separately says `POST /` "sets `ownerId` from the session." The diagram routes `OwnershipMW --> InvoiceRoutes` for all invoice routes including create, but the middleware's job for create (pass-through, no existing owner to check) versus its job for get/update/delete/send (reject) isn't distinguished in the component description. Cosmetic, not blocking.

**Minor — session-file-store cleanup is unaddressed.**
A file-backed session store with a ~30-day expiry (FR12) will accumulate expired session files if nothing prunes them. Not called out anywhere. Operational detail, not an architectural defect, but worth a line before implementation.

## 4. Design Decisions Requiring Human Approval

These are places where `architecture.md` made a concrete, implementable choice on something requirement.md left open. They should be explicitly signed off, not inherited by default because a document happened to propose them:

1. **Confirmation transport for editing/deleting a sent invoice** — HTTP 409 + `confirm: true` body flag (§6, §4.3). requirement.md specifies only the behavior.
2. **CSRF defense baseline** — currently undecided; needs at least a stated position (e.g., `SameSite=Lax` cookies as the floor) before implementation starts, per the gap above.
3. **Account-provisioning mechanism for FR15** — correctly left undesigned in §12; someone needs to decide before this ships whether it's a CLI script, direct `users.json` edits, or an admin API, since that affects what (if anything) needs to be built.
4. **Password complexity rules** — §12 assumes none; confirm this is acceptable for real client-facing credentials before building password-reset with no minimum strength check.

## 5. Open Questions (carried from architecture.md §12, unresolved — not blocking, but unresolved)

- Multi-device/session management (no revoke-other-sessions capability).
- TLS/HTTPS termination ownership (deployment concern, correctly out of scope here, but someone owns it).
- UI visual design — no wireframes exist for login/reset/send/confirmation screens.

## 6. Required Changes to `architecture.md`

1. **Fix the §3 component diagram**: `AuthRoutes` (login, forgot-password, reset-password) must not sit behind `AuthMW`/`requireSession`. Only `logout` legitimately requires an existing session. Redraw so `SessionMW --> AuthRoutes` directly (session middleware still runs to *parse* a cookie if present, but `requireSession`'s rejection gate should not block these routes), with `AuthMW --> OwnershipMW --> InvoiceRoutes` unchanged for the invoice-facing side.
2. **Add an explicit CSRF-defense line** to §9 (Security Considerations) stating the chosen baseline, once decided per §4.2 above — not left as a bare open question in §12.
3. **Add one sentence to §5 or §10** noting `sendHistory` is unbounded by design at this scale (mirrors the existing flat-file-no-locking acknowledgment already present) — optional but recommended.

No other structural changes are needed; the FR/NFR-to-component mapping, data model, and security section are otherwise sound.

## 7. Verdict

**Approved with Changes.**

The traceability is complete and the overall shape (modular monolith, flat-file persistence extended rather than replaced, minimal new dependencies, shared Email Service) is well-reasoned and correctly grounded in the actual codebase. However, the §3 diagram's auth-route placement is a genuine defect — if implemented as drawn, login is unreachable — and must be corrected before this document is used as an implementation basis. The CSRF baseline should be decided explicitly rather than left as a footnote, given this is the story that introduces cookie-based sessions in the first place. Once those two items are addressed in `architecture.md` (change 1 is required; change 2 is strongly recommended before implementation begins), this design is ready to build against.
