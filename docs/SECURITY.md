# Security and privacy — ContextWise v0.1.9 audit boundary

## Current reality
The live site is a **publicly hosted prototype, not a private encrypted vault**. It authenticates with Firebase and can request Google Drive OAuth for folder access and an optional broader read-only archive action. The site renders selected archive JSON only in tab memory; plaintext export downloads a local .txt. The existing Google Drive JSON snapshots are not encrypted by ContextWise.

The Firebase web apiKey is a public client configuration value, not an administrator credential. Never confuse it with a Google OAuth access token, refresh token, service-account key or VaultWise signing key. No Drive tokens are intentionally stored in localStorage, source control, or Firebase.

## Risks and controls
- **Broad read permission:** `drive.readonly` potentially exposes more Google Drive metadata/data to the authorized client than the ContextWise folder. Explicit user consent is required and the code filters to the ContextWise folder. This is not an adequate substitute for a future least-privilege storage architecture.
- **In-session access:** Archive content is visible to browser JavaScript while loaded. Browser extensions, a compromised device/session or third-party scripts could potentially access it. Current frontend fetches Firebase SDK modules from Google's pinned CDN version; external dependency trust remains.
- **Unencrypted history:** JSON in Drive and exported text are plaintext. No lock/unlock, customer-held encryption key, backup encryption or recovery mechanism exists.
- **Account separation:** Firebase login, Drive OAuth and archive content authorization are separate. Real-account signed-in, wrong-account, token expiry and popup-denial tests are still required; do not claim account-isolation verified by unit tests.
- **Evidence uncertainty:** Schema v1 relational edges cannot yet represent inferred-versus-verified confidence, while imported source refs are displayed as inert text.
- **Privacy metadata:** Public docs and the reusable Archivist skill should resolve each user's Drive folder dynamically, not embed a personal Drive folder/file ID. Identifiers removed from current branch files in this audit; prior Git commits may retain them. The IDs alone are not Drive access credentials.
- **Abuse limits:** JSON import is bounded to 2 MB and counts are validated. The Drive reader currently relies on provider file-size metadata before parsing; streaming/body-size enforcement and pagination tests are still needed.

## Local project conversation preview boundary (v0.1.11)
- Same-origin BroadcastChannel posts may be visible to other open tabs under the same Firebase UID. This is client-side scoping, **not** a secure authenticated agent relay or encrypted persistent message store.
- Do not use the local demo for confidential messages or API tokens. User-entered author labels and chat messages have no verified authority and cannot approve/supersede project decisions.
- Agent handoff is explicitly copied by a person, and may contain selected event summaries/source refs; review before sharing. See CHAT_RELAY_DESIGN.md.

## Required before private-production readiness
Threat model; verified Google OAuth scopes and browser tests; encryption at rest with authenticated encryption and approved key recovery; authorization checks on reads/writes, deduplication/versions and rollback; XSS/security review; mobile, accessibility, consent-revocation and error-path tests. No unapproved native credential bypass or BuildWise broker is authorized.

See [AUDIT_2026-11-03.md](AUDIT_2026-11-03.md) for dated findings and [STANDARDS.md](STANDARDS.md) for mandatory release criteria.
