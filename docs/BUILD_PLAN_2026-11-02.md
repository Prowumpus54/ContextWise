# ContextWise — P0 Build Plan and Tasker Milestone Register
Date: 2026-11-02 (America/Chicago)
Status: planned. Do not infer deployment or task claims from inclusion in this file.
Owner remains Owner/Admin; BuildWise does not execute milestones simply because they are captured in Tasker.

## Product boundary
ContextWise is one website. Firebase Authentication identifies the person and stores only minimal vault/provider registration metadata; no conversation/event graph content belongs in Firebase. User chooses Google Drive, OneDrive, Dropbox or a local-device vault. ContextWise creates and reads a **portable encrypted vault** there, and presents a zoomable timeline plus branched conversation knowledge graph. Initially ChatGPT acts as the Archivist via a skill using accessible ChatGPT chats/exports and Wise GitHub evidence. MCP and provider-independent AI access are explicitly deferred to P1.

## Critical safety constraints
- Login is not vault decryption; keys and recovery are independent of Firebase.
- Cloud storage requires an initial OAuth grant; browser-only desktop storage cannot run closed-browser nightly jobs.
- Never store a shared mutable SQLite database directly in a sync folder; use encrypted versioned records, snapshots and conflict management.
- Maintain source identity/provenance, no fabricated chat coverage or causal claims. Statuses must distinguish coded/tested/installed/deployed/owner-accepted.
- Never enable storage of private real histories before cryptographic and permission threat-model tests.
- A skill isn't a scheduler. Manual ChatGPT-driven archival is P0; unattended workers require explicit separate design.

## Suggested delivery order
Wave A: CW-001..006 (schema, UI, manual Archivist skill and evidence ingestion).
Wave B: CW-007..010 (Firebase identity, local and cloud storage, crypto/recovery).
Wave C: CW-011..012 (real Tasker graph acceptance, release/security gates).
Parallelize only after dependencies and security boundaries are settled.

## Milestones
### CW-001 — Lock architecture and portable vault contract
Priority: P0
Dependencies: None
Scope: Define Firebase Auth as identity only; user-selected encrypted vault in Google Drive, OneDrive, Dropbox or local device; separate auth from encryption; versioned portable manifest, provider adapter interface, data ownership and conflict policy.
Acceptance: ADR and schema reviewed; no history stored in Firebase; provider migration and recovery sequence documented; fixtures validate.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-001

### CW-002 — Graph v2 schema and migrator
Priority: P0
Dependencies: CW-001
Scope: Implement projects, events, conversations, immutable source references, typed directed relationships (DISCUSSED_IN, INFLUENCED, RESULTED_IN, BLOCKED_BY, RESOLVED_BY, SUPERSEDED_BY), evidence, confidence, revisions and statuses. Migrate existing v1 JSON without dropping history.
Acceptance: Versioned JSON schema, parser and deterministic v1-to-v2 migration; orphan/duplicate/cycle and ID validations; schema tests.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-002

### CW-003 — Zoomable timeline and branching mind map
Priority: P0
Dependencies: CW-002
Scope: Interactive time-axis pan/zoom/cluster and graph branches from event to related summarized chats, decisions and influenced chains; click-through inspector, filters, keyboard and responsive mobile UI.
Acceptance: Tasker sample renders branching evidence and multiple influence chains; timeline and graph share selection; accessibility/browser smoke passing.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-003

### CW-004 — ChatGPT Archivist skill
Priority: P0
Dependencies: CW-002
Scope: Create skills/contextwise-archivist/SKILL.md and procedures for accessible ChatGPT history and Wise GitHub sources; summarize chats; distinguish direct links from inferred influence; include citations; produce graph v2 JSON; never claim exhaustive chat access.
Acceptance: Skill and example prompts committed; deterministic output validation; source-linked summaries; evidence review statuses and missing-source notices.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-004

### CW-005 — GitHub evidence collector
Priority: P0
Dependencies: CW-004
Scope: Read Wise repo commit/branch/PR/issue history through authenticated read access; avoid treating branch commits as merged, tests as deployed, or draft as complete. Incremental cursor, stable IDs and provenance.
Acceptance: Repeat scans idempotent; branch provenance preserved; missing/unauthorized repositories reported; Tasker fixture coverage.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-005

### CW-006 — Archivist merge, review and archive workflow
Priority: P0
Dependencies: CW-002,CW-004,CW-005
Scope: Import ChatGPT exports and skill JSON; dedupe by source identity/content hash; compare existing graph; propose typed relationships; review inferred edges and conflicts; archive originals without deletion; incremental checkpoints.
Acceptance: Running twice creates no duplicates; verified vs inferred links labeled; no silent overwrite; reversible review and audit events.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-006

### CW-007 — Firebase Authentication and account setup
Priority: P0
Dependencies: CW-001
Scope: Build sign-in and sign-out with Google and email where enabled; UID owns vault registration/metadata only; account setup selects storage; login alone never unlocks encrypted vault; no user history in Firestore.
Acceptance: Auth emulators and rules tests deny cross-user metadata reads; sign-out clears unlocked state; metadata contains no chat plaintext.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-007

### CW-008 — Storage adapter framework and local vault
Priority: P0
Dependencies: CW-001,CW-002
Scope: Provider-neutral read/write/list/revision/backup abstraction; browser-managed local storage for P0, explicit export/restore; optional desktop companion later for arbitrary folders and unattended processing.
Acceptance: Local persistence, restart restore, versioned backups, corruption detection, deterministic replay, quota/error behavior, and migration tests.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-008

### CW-009 — Vault encryption, unlock and recovery
Priority: P0
Dependencies: CW-008,CW-007
Scope: Vetted client-side authenticated encryption, separated master key from Firebase identity, passphrase/recovery design and lock lifecycle; encrypted metadata/index decisions; threat model and independent security review before private-data claims.
Acceptance: Wrong key, tampering, lock/sign-out, failed recovery, backup restore and key-rotation tests; no unencrypted private content at rest or sent to providers.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-009

### CW-010 — Cloud drive adapters and guided setup
Priority: P0
Dependencies: CW-008,CW-009
Scope: Integrate Google Drive, OneDrive and Dropbox via explicit provider OAuth and least privilege; establish per-user vault file container; encrypted snapshots and conflict-safe sync, not one mutable SQLite file across devices.
Acceptance: Each provider has authorized create/read/sync/migrate tests, token expiry handling, atomic/version-safe updates, offline/conflict diagnostics and no silent overwrite.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-010

### CW-011 — Tasker full-history reference graph and acceptance
Priority: P0
Dependencies: CW-003,CW-004,CW-006
Scope: Use vetted ChatGPT discussions plus relevant Tasker/BuildWise/VaultWise GitHub history; link conversation summaries to events, decisions and later impacts; retain source evidence and blocked/deployed/tested distinctions.
Acceptance: Tasker graph navigable end-to-end; representative causal paths manually reviewed; import/export roundtrip lossless; known gaps surfaced.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-011

### CW-012 — Release, security gates and usable deployment
Priority: P0
Dependencies: CW-007,CW-009,CW-010,CW-011
Scope: GitHub Actions, web regression, Firebase auth rules, cloud/provider permission review, accessibility, mobile browsers, backup/recovery and onboarding docs; publish demo without plaintext user content.
Acceptance: CI green, deployment URL verified, onboarding works with one login plus one-time provider grant and vault unlock, audit/recovery checklist signed off.
Tasker project: contextwise
Stable sourceId: contextwise-build-plan-20261102-cw-012

## P1 (not to be captured as P0)
- CW-P1-001: Optional MCP read-only interface, token-budgeted context and scoped user-approved retrieval.
- CW-P1-002: Agent-neutral access, explicit grants/revocation, audit, and connector compatibility.
- CW-P1-003: Scheduled unattended Archivist/desktop companion if user elects to enable it.
- CW-P1-004: Additional external AI conversation sources beyond ChatGPT and Wise GitHub.

## Source/review workflow
Keep this GitHub document as the plan of record. Capture P0 entries in Tasker's **AI Development Inbox**, not household Review Inbox. Use stable milestoneId/sourceId and idempotency. A successful capture is an *open milestone*, not a claimed BuildWise job or an authorized deployment.
