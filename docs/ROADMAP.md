# Roadmap

## P0 — Human-first web app
P0.0 Repository scaffold: documentation, sample timeline, zoom modes, project switching, manual bounded import, plain-text scoped export and tests. Source committed, verification still needed.
P0.1 Timeline UX: time-axis zoom/pan, clustering/branching, event detail, search, filters, keyboard/accessibility.
P0.2 Local-first security: threat model, reviewed encryption/key recovery, secure persistence, backup/restore, lock/unlock and tamper tests.
P0.3 Data experience: evidence-linked import review, duplicates, versions/superseded decisions, project resume view, share-preview/redaction.
P0 exit: repeatable tests, usability evidence, and security review for stored personal data.

## P1 — AI interoperability (deferred)
Current early P1: connected Google Drive plugin is the archivist write path; one Tasker JSON snapshot uploaded and verified. Repo agent instructions: `.agents/skills/contextwise-archivist/SKILL.md`. This is **not** continuous background ingestion, installed global skill, server-side MCP or browser archive synchronization.

Later, on separate owner authorization: BuildWise-backed credential broker, per-user archive API, audited idempotent writes, secure reader, and website sync. The backend is explicitly **deferred** as of 2026-11-03.
