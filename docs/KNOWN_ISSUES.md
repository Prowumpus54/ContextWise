# Known issues and engineering gates — 2026-11-03

| ID | Priority | Status | Description / required follow-up |
|---|---|---|---|
| CW-001 | P0 for private production | Open | No encrypted vault or lock/recovery. Plaintext archives and browser exports; public preview is not an approved private-data vault |
| CW-002 | P1 | Open | Timeline uses three discrete filters, not continuous time-axis zoom/pan |
| CW-003 | P1 | Open | No automatic/scheduled archive ingestion or idempotent conflict-merged write path |
| CW-004 | P1 | Open | No source confidence, inferred-vs-evidenced labels, status reconciliation or supersession in graph schema |
| CW-005 | P1 | Open | Real signed-in Google Drive read-only consent, private combined JSON import and cross-account failure cases not E2E-verified |
| CW-006 | P1 | Open | Browser Drive reader requests broader `drive.readonly` OAuth scope than an app-folder-only read adapter would ideally need; explicit consent and folder filter in place |
| CW-007 | P2 | Open | Reader checks Drive metadata size before parsing but lacks an independent bounded download/body-size limit and robust archive pagination |
| CW-008 | P2 | Open | Multi-device sync, secure version/ETag conflict handling, rollback and encrypted backups not implemented |
| CW-009 | P2 | Open | Full mobile/accessibility manual smoke, security review and malicious-import tests still pending |
| CW-010 | P2 | Open | Historical Git commits contain a personal Google Drive folder/file identifier in documentation; current main removes it. IDs are not credentials but remain in immutable older commits unless separately rewritten |
| CW-011 | P2 | Open | Browser storage preference is not a real OneDrive, Dropbox or desktop adapter |
| CW-012 | P2 | Open | BuildWise credential backend/MCP explicitly deferred by owner; not a blocker for connector-only archivist |
| CW-013 | P2 | Open | Firebase Hosting Cloud Logging integration is optional and not enabled by the v0.1.10 browser changes; owner must link it to view actual site-wide HTTP requests |

Prior issue claiming hosting was not deployed is obsolete: Firebase Hosting v0.1.9 is live. See `AUDIT_2026-11-03.md`.
