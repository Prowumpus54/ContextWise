# ContextWise Engineering and Data Standards

Version: 1.0 (documentation baseline)  
Established: 2026-11-02 (America/Chicago)  
Scope: website, future portable vault, ChatGPT Archivist workflow, connected evidence collection and eventual MCP access.

This document sets the **required design and acceptance standards**; it is not a claim that all components are implemented. Read docs/CURRENT_STATE.md on the branch being deployed, docs/INTEGRATIONS.md, docs/SECURITY.md and docs/FEATURES.md before changing behavior. In this document MUST means required, SHOULD means preferred unless a documented exception is approved, and MAY means optional.

## 1. Product and authority boundaries

1. ContextWise is a single web entry point for viewing a user's project history, decisions, evidence and related conversation branches.
2. Firebase Authentication identifies the user. Firebase/Firestore MUST NOT be the store for the user's conversation text, event graph, documents or vault master key. Minimal account/vault registration metadata is allowed when documented and access controlled.
3. The user chooses the storage destination: Google Drive, OneDrive, Dropbox or local computer/device storage. Selection is not proof that the provider is connected or that a vault has been created.
4. The durable project archive is intended to be a **portable, encrypted, user-owned vault**. The current browser import and export are **not encrypted**. No real private history should be imported into the present demo before appropriate review.
5. Website login, cloud-provider authorization, and archive unlock are three distinct operations. Signing into one MUST NOT silently unlock or authorize another.
6. ChatGPT plus the user's authorized Wise GitHub repositories are the initial Archivist source set. Any additional AI platform, service or account needs a separate integration and authorization.
7. The current authorized Archivist writer uses the connected Google Drive plugin; the BuildWise backend was deliberately deferred. Do not add a new persistent broker, server, or unattended ingestion without explicit approval.
8. Owner/Admin remains the ultimate authority. Agent work cannot confer permissions on itself.

## 2. Required records and graph behavior

A project/event record MUST preserve a stable ID, source provenance, event date, type, title and summary. Source records MUST be distinguishable from AI interpretation.

The **implemented JSON import contract** is schemaVersion 1:
- Root: schemaVersion: 1, projects array of 1–100.
- Project: id, title, optional description, events (0–5,000).
- Event: id, date (real YYYY-MM-DD calendar date), type, title, summary, sourceRefs (0–12).
- Event types: milestone, decision, blocker, note.
- IDs: 1–64 safe ASCII letters/digits/underscore/hyphen, starting with a letter or digit; unique project IDs globally, event IDs within their project.
- Project title <= 120 characters; description <= 3,000; event title <= 160; summary <= 4,000; each source ref <= 400.
- Browser imports must not exceed 2,000,000 bytes. These are implementation limits in web/src/validate.mjs and MUST be kept synchronized with tests, docs, and any archive writer.

**Graph schema v2 remains planned.** The deployed v0.1.9 code has a backward-compatible optional `relations` array in schemaVersion 1, linking existing events across projects. That extension does not yet express evidence confidence or inferred-vs-confirmed status, so the visual edges are not proof of causation. v2 SHOULD add conversations, source entities, typed relationships, evidence confidence, revisions, resolution/supersession, and one-to-many project links. The intended relationships include DISCUSSED_IN, INFLUENCED, RESULTED_IN, BLOCKED_BY, RESOLVED_BY and SUPERSEDED_BY. Edges MUST distinguish explicit source-grounded relationships from analyst-inferred relationships. A visual branch is not proof of causation. Every migration from v1 MUST be deterministic, reversible through retained originals and tested for loss.

## 3. Provenance, summarization and truthfulness

- Every extracted fact MUST reference retrievable source identity where available (chat/conversation reference, message, Git commit and branch, PR, issue, file revision, timestamp).
- Classify assertions as: directly evidenced, inferred/pending review, disputed, or source unavailable. Do not invent links or fill coverage gaps with guesses.
- Keep source dates separate from ingestion dates and update timestamps.
- Preserve evidence status: proposed, coded, committed, tested, installed, deployed, verified, owner-accepted. These are NOT interchangeable. A commit is not a deployment; a test result is not owner acceptance.
- Summaries SHOULD be concise, neutral, structured and connected to their source records. Corrections and superseded decisions MUST remain traceable rather than erasing the older account.
- When a chat or repository cannot be accessed, record the gap explicitly. Never claim complete ChatGPT history coverage based only on partial access.

## 4. Archivist ingestion and idempotency

1. Gather only data within the user's requested scope and existing connector permissions.
2. Read existing destination metadata before creating or replacing an archive. Use verified account, folder and file identifiers.
3. Normalize and validate JSON against the exact schema version and documented size limits.
4. Generate deterministic/stable source IDs; use source identifiers and/or content hashes to detect replays and duplicates. Identical reruns MUST NOT silently create duplicate events.
5. Preserve originals; write an immutable dated snapshot when safe in-place revision cannot be verified.
6. Flag conflicts, missing evidence and inferred graph edges for review. Avoid silent overwrite or irreversible auto-merge.
7. After a write, verify destination folder, file metadata, MIME type and readable content when supported. Report created, updated or snapshotted truthfully.
8. ChatGPT connector writes DO NOT imply that the ContextWise website can read the same file. The website uses separate authorization and may lack rights under the drive.file scope.
9. A repository agent skill is an instruction set, not an always-on service, installed account-wide feature or background scheduler. Runs require explicit invocation or separately approved scheduling.

The maintained workflow contract is `.agents/skills/contextwise-archivist/SKILL.md` on `main` after the 2026-11-03 integration.

## 5. Portable vault and storage contract (planned)

- Define a versioned manifest, per-record stable IDs, content schema versions, encrypted content files/snapshots, integrity data and migration rules independent of provider.
- A provider adapter SHOULD offer list/read/create/revision-aware update/backup/restore and report unavailable, authorization-expired, quota, conflict, or offline errors.
- Never use one mutable SQLite database directly in a multi-device sync folder. Prefer encrypted versioned records and snapshots with explicit conflict resolution.
- Define clear migration/export procedures so a user can change storage providers without losing source links or graph relationships.
- A local-browser storage selection MUST NOT be described as desktop-folder access. Arbitrary filesystem access or unattended closed-browser tasks require separately approved native/desktop functionality.
- Firebase login, provider OAuth and vault unlocking MUST be separately accounted for in UI and diagnostics.
- Encryption choices, key derivation, backup/recovery, lock lifecycle and rotation MUST pass threat modeling and independent review before enabling real private records.

## 6. Security, privacy and permission standards

- Least privilege and fail closed. Future grants are scoped independently by **user, client/agent, project, operation, and time**. Record grant, use, denial, expiry and revocation in an auditable form.
- Never store API keys, refresh tokens, vault master keys, private chat archives, account secrets or local personal vaults in public Git, sample fixtures, diagnostic logs, or chat transcripts.
- Do not expose provider refresh tokens directly to agents, web localStorage, GitHub workflows or browser content.
- Use safe DOM text rendering (textContent or equivalent) for imported strings. Treat all imported files, model summaries and connector output as untrusted data.
- Do not transplant Windows DPAPI/CNG or VaultWise native key code into browser JavaScript.
- If implementing cryptography, require authenticated encryption, an approved key-management/recovery design, explicit lock/unlock semantics, tamper tests and protected metadata/search-index behavior.
- User-approved context retrieval MUST be minimized to the requested task. Future AI context bundles need a preview/redaction path and an audit trail.

## 7. MCP and interoperable API standards (P1, not live)

MCP is an optional, read-only-first, provider-independent access layer; it is not the primary database or authentication system.

Planned operations: list_projects, search_context, get_event, get_conversation_summary, get_related_context and get_context_bundle.

- Interface contracts MUST be versioned with typed arguments/results, structured errors, cursor/pagination and a documented token/response budget.
- Every request MUST enforce user identity, current grant scope, allowed project/operation and rate/size limits before any content is returned.
- Denied, expired and revoked grants MUST fail closed; revocation MUST take effect before future reads.
- Test isolation between separate users, projects, clients and sessions. Never grant broad archive access merely because a Firebase session exists.
- Provider connectors MUST not have hidden write privileges in a read-only MCP surface.
- Publish transport, compatibility, setup and troubleshooting documentation only for interfaces actually implemented.

## 8. Web UX and accessibility standards

- The timeline, graph and event inspector MUST use the same project and record identity; navigation MUST not leak details from a previously selected project.
- Search and filters MUST clearly describe their scope; graph links must be inspectable and visually distinguish evidence-backed versus inferred connections.
- Show actual connected/unconnected, locked/unlocked, uploaded/not-loaded and demo/real states; avoid generic “connected” indicators implying sync.
- Support keyboard interaction, visible focus, readable contrast, responsive layouts and meaningful screen-reader announcements.
- No hidden imports/exports, silent private-data uploads or background processing without appropriate consent.
- Prioritize quick capture, inspection and retrieval over decorative motion; large archives will require progressive rendering and bounded queries.

## 9. Repository, tests and release standards

- main is the documented source of truth; nontrivial work SHOULD use feature/<scope> branches and PR review.
- Source changes MUST update corresponding docs/CURRENT_STATE.md, docs/FEATURES.md, data contracts, tests, and diagnostics when behavior changes.
- Maintain schema fixtures and deterministic tests for parsing, validation, identity, deduplication, migration, export/import roundtrip, provenance, authorization, denied access and storage failure.
- Run npm run verify and report its **observed** result; do not claim a passing test or deployment without evidence. Browser behavior, Firebase auth rules, OAuth scope and cloud-provider access also require separate smoke/security tests.
- Keep synthetic fixtures public-safe; test with real/private project archives only in the authorized protected environment.
- Document releases with branch/commit, exact build/version, tests, deployment target, limitations, rollback and known issues.
- Keep an engineering record of decisions, issue/PR evidence and learned failures. Do not mark a milestone complete until its acceptance criteria have actually passed.

## 10. Documentation ownership and precedence

- docs/STANDARDS.md (this file): required cross-cutting rules.
- docs/FEATURES.md: desired features, baseline implementation distinctions and acceptance expectations.
- docs/CURRENT_STATE.md: most recent **verified** branch/environment status.
- docs/DATA_MODEL.md: exact deployed import schema.
- docs/ARCHITECTURE.md and docs/SECURITY.md: technical boundaries and threat model.
- docs/INTEGRATIONS.md: verified external service connections.
- docs/BUILD_PLAN_2026-11-02.md: milestone IDs/dependencies and P0/P1 scope.
- docs/DECISIONS.md: approved design decisions and amendments.
- .agents/skills/contextwise-archivist/SKILL.md (on main): actual connector-driven writer procedure.

If documents disagree: **observed code/test/deployment evidence wins for current capability**, approved owner decisions control future intent, and the strictest documented security boundary applies until formally reviewed. Update contradictory documentation rather than quietly choosing a more convenient claim.
