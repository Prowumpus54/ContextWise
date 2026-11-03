# ContextWise Feature Documentation

Version: 1.1 | Updated: 2026-11-03 (America/Chicago)
Purpose: human-readable feature inventory, intended experience and acceptance criteria. **Planned features are not promises of implemented functionality.**

## Goal

ContextWise is the user-controlled, visual memory layer for a project. It turns conversations, design decisions, milestones, GitHub evidence, blockers and follow-up outcomes into a navigable history. A person can see **what happened, why it happened, what changed later, and which original source supports the story**. It must remain usable without giving any AI unrestricted access to an entire personal archive.

## Status legend

- **In main prototype:** present in repository main; not necessarily deployed.
- **On main and deployed:** code merged from the Firebase feature branch into main; the v0.1.9 website was separately deployed to Firebase Hosting before the merge. Git merging does not deploy Firebase.
- **Connector workflow verified:** external ChatGPT Google Drive writer operated independently of the website.
- **Planned P0/P1:** design/milestone scope only; no functional release claim.

## Current feature inventory

| Capability | Current evidence and boundary | Next requirement |
|---|---|---|
| Project timeline | In main prototype: synthetic sample projects and date-sorted event list | True time-axis pan/zoom and clustering |
| Zoom/search/inspector | In main/deployed: category-based overview/detail/all, search, inspector and interactive Connected Ideas map with optional schema v1 cross-project event links | Evidence/confidence labels, continuous time-axis zoom, mobile and keyboard tests |
| Manual ContextWise JSON import | In main prototype: bounded schemaVersion 1 file; tab-memory only | Archive-backed reading and review |
| Project-scoped text export | In main prototype: local plaintext file of selected project | Privacy preview, citations and token budget |
| Firebase sign-in | In main/deployed v0.1.9: Google authentication, previously verified by signed-in user diagnostics | Isolate account metadata; test denied/wrong-account paths |
| User storage choice | In main/deployed: account-keyed browser-local preference for Drive/OneDrive/Dropbox/desktop (latter three are selection only) | Real adapter for each user-selected location |
| Google Drive browser connection | In main/deployed: folder connection via drive.file; separately consented drive.readonly loader for combined snapshots. Browser token is session-only | Reduce read scope and verify signed-in archive loading |
| Hosted website | Live at contextwise-4a846.web.app, serving v0.1.9 before main merge | Verify release/version on every deployment |
| ChatGPT Archivist writer | Connector workflow verified: Tasker JSON snapshot placed in user's authorized Drive ContextWise folder | Repeatable source review, incrementals and website reader |
| Website auto-sync of uploaded JSON | **Not implemented**; explicit user-click Load archived projects reader is implemented but owner-authenticated E2E unverified | Validate consent/reader and design a scoped sync path |
| Encrypted portable vault | **Not implemented** | Threat model, vetted crypto, recovery and tests |
| Continuous background Archivist | **Not implemented**; no daemon/scheduler | Optional, separately authorized workflow |
| MCP and third-party AI access | **Not implemented** | P1, read-only-first, scoped grants and audit |

## Feature specifications

### F01 — Project overview and timeline
**User story:** open a project and understand the chronology at a glance.  
**Behavior:** switch projects; see key milestones, decisions, blockers and notes. Search within the current project and drill into an event inspector with original source refs.  
**P0 acceptance:** no cross-project inspector leakage; selected zoom/search are predictable; project and event counts reflect imported data.

### F02 — Zoomable chronology and branching mind map
**User story:** zoom out for the big picture, zoom in to each design discussion, and follow branches between chats and resulting work.  
**Planned behavior:** continuous time-axis pan and zoom, event clustering, selectable conversation-summary branches and typed influence/dependency links. Cross-links may converge on later events; the same conversation can support more than one event.  
**P0 acceptance:** timeline and graph share one selection state, orphan links are handled, inferred relationships are clearly marked and can be reviewed; keyboard/mobile navigation works. This is not the same as the prototype's three category filters.

### F03 — Evidence-linked conversations and summaries
**User story:** click a milestone and see which conversations informed it.  
**Planned behavior:** concise summaries attached to source conversations/messages, plus GitHub commits/issues/PRs as evidence. Show what was explicitly stated versus inferred.  
**P0 acceptance:** every claim with a source points to its stable reference; missing/unavailable source is visible; updates do not erase prior versions.

### F04 — ChatGPT Archivist
**User story:** ask ChatGPT to archive a project without manually posting raw JSON to the website.  
**Current path:** a repo-managed Archivist procedure instructs authorized ChatGPT/Work agent runs to collect accessible ChatGPT context and Wise GitHub evidence, produce validated schema v1 JSON, write it into the connected Google Drive ContextWise folder and verify the file. A Tasker history snapshot has been written and verified.  
**Limitations:** no account-wide always-on skill, full-history guarantee, direct website sync or automatic scheduler.  
**P0 acceptance:** idempotent re-runs, source-linked summaries, conflict review, validated JSON and verified file destination. A new archive snapshot must never silently overwrite a different original.

### F05 — Wise GitHub evidence collection
**User story:** connect the story of an app's development to its actual code history.  
**Planned behavior:** project-scoped read of repositories, commits, branches, PRs, issues, build/test artifacts and available release events.  
**P0 acceptance:** distinguish branch commits from merged changes and deployments; stable source IDs; incremental collection; clear missing-repo/permission notices.

### F06 — Login and ownership
**User story:** sign into one ContextWise site and see only my vault registration.  
**Current path:** Google Firebase sign-in on main and the deployed Firebase v0.1.9 website.
**Future behavior:** Firebase holds identity/minimal provider registration only, not project histories. Login must never be equated with vault unlock.  
**P0 acceptance:** sign-out revokes unlocked browser state, cross-account registration is denied, and no raw conversation content appears in Firebase metadata.

### F07 — User-selectable storage
**User story:** choose Google Drive, OneDrive, Dropbox or desktop storage from ContextWise.  
**Current path:** browser-local preference, Google Drive folder connection, and separately consented read-only Drive snapshot loader. No OneDrive/Dropbox/desktop provider adapter is implemented.
**Planned behavior:** portable versioned encrypted vault created/read at chosen destination; provider can be migrated with history intact.  
**P0 acceptance:** provider auth, error handling, migration, backup and conflict-safe sync tested. Desktop arbitrary-folder access needs a separately approved helper if browser limitations prevent it.

### F08 — Archive privacy, encryption and recovery
**User story:** keep my history under my control and recover it from backups if necessary.  
**Planned behavior:** explicit vault unlock, vetted authenticated encryption, separate recovery mechanisms, encrypted provider storage, backups, tamper detection and key rotation.  
**P0 acceptance:** no plaintext at rest, tested wrong-key/tamper/sign-out behavior, version-aware restore and independent security review before private-data use.

### F09 — Context packages and project handoff
**User story:** generate only the history another agent needs for a particular assignment.  
**Current path:** selected-project plaintext export from browser prototype.  
**Planned behavior:** source-linked, bounded summaries with a share preview, redact/omit controls and context token budgets.  
**P0/P1 acceptance:** user selects projects/scope; excluded content is not in output; shared bundle retains provenance and clear expiry when remotely granted.

### F10 — Review, correction and decision lineage
**User story:** correct an incorrect connection without losing history.  
**Planned behavior:** flag inferred edges, confirm/deny causal links, supersede prior decisions, resolve blockers, deduplicate reimported messages and retain audit history.  
**P0 acceptance:** no silent overwrite, reversible resolution process and correct status distinctions (planned / coded / tested / deployed / accepted).

### F11 — MCP interoperability (P1)
**User story:** let a permitted AI client retrieve a narrow, relevant slice of context instead of my entire vault.  
**Planned behavior:** optional provider-neutral read-only MCP, exposing list_projects, search_context, get_event, get_conversation_summary, get_related_context, get_context_bundle.  
**P1 acceptance:** grants limited by client/project/operation/time, revocation enforced, audit logs, structured versioned API, token budgets, tests against cross-user/project leakage. **Not a live endpoint.**

### F12 — Optional scheduled archival and BuildWise integration (deferred)
**User story:** automatically keep project history current without repetitive manual export.  
**Planned behavior:** separately approved background job/desktop companion and, only with new authorization, a BuildWise-backed credential broker with VaultWise protections and idempotent archive API.  
**Boundary:** explicitly deferred in favor of the connected Google Drive writer. Do not implement an unattended token broker or claim permanent browser OAuth on the strength of the ChatGPT plugin connection.

## Roadmap and milestones

**P0:** CW-001 portable-vault contract; CW-002 graph v2; CW-003 timeline/mind map; CW-004 Archivist; CW-005 GitHub collector; CW-006 merge/review; CW-007 Firebase identity; CW-008 storage adapters; CW-009 encryption/recovery; CW-010 cloud adapters; CW-011 Tasker reference graph; CW-012 release/security gates.

**P1:** CW-P1-001 MCP read-only; CW-P1-002 scoped agent authorization/audit; CW-P1-003 optional unattended Archivist; CW-P1-004 other conversation providers. See docs/BUILD_PLAN_2026-11-02.md for dependencies and acceptance detail.

## Critical user experience distinction

The **Archivist can write a JSON archive to Drive** using its connected plugin. The **ContextWise website does not automatically consume that file**. v0.1.9 can explicitly read a combined snapshot only after Google sign-in, an additional read-only Drive permission and the user's **Load archived projects** click; owner-authenticated real-file E2E is still unverified. Logging into ContextWise and selecting Drive is not equivalent to encrypted storage or persistent browser OAuth. The end-to-end experience is not complete until vault encryption, provider-read access, graph rendering, and security tests are implemented and verified.

For normative requirements see docs/STANDARDS.md; for verified current status and open release gates see docs/CURRENT_STATE.md and docs/AUDIT_2026-11-03.md.
