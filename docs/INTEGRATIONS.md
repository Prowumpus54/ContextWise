# Integrations — connector-first archive writing (2026-11-03)

## Active: Google Drive plugin as archivist writer
The **connected ChatGPT Google Drive plugin** can access the user's `ContextWise` folder and write JSON archives **without the user manually posting a JSON file to the website**. It is an existing connected app authorization, not a token stored by ContextWise.

- Destination: the authorized user's `/Google Drive/ContextWise` folder, resolved and verified at runtime. Its private folder ID is intentionally not published in this repository.
- Verified 2026-11-03: `tasker_complete_development_history_contextwise.json`, 43,417 bytes, `application/json`, uploaded using the Files Library Google Drive mount and confirmed through Google Drive metadata readback.
- Workflow: `../.agents/skills/contextwise-archivist/SKILL.md`.
- Invocation: user asks ChatGPT/Work to archive a named conversation or project; agent gathers authorized sources, validates ContextWise schema v1, uploads JSON using connected Google Drive tools or Files Library mount, verifies the destination and reports it.
- No standalone automatic watcher/scheduled ingestion is configured. Connected app authorization can require reauthorization, and a task/agent run must actually be initiated.
- A Google Drive plugin read/write cannot by itself grant agents access to unrelated private sources; each source is governed by its own connector and authorization.

## Separate: browser-side Google Drive OAuth
Firebase Hosting: https://contextwise-4a846.web.app, project `contextwise-4a846`.
- Google sign-in and user-selected storage preference work.
- `Connect Google Drive` has been confirmed working; it creates or locates a dedicated folder with the `drive.file` scope.
- Its Google access token is **in memory only**. It is not durable after the browser session. Firebase sign-in persistence is not the same as permanent Drive API access.
- The browser's Drive permission is **not** the plugin's connection. The browser may **not** be permitted to read a JSON file written by the plugin under the restricted `drive.file` scope, even when both refer to the same folder.
- Since v0.1.9 the website has an explicit **Load archived projects** action using separately approved `drive.readonly` permission. It can read the latest combined archive from the owner's ContextWise Drive folder into the browser session. This is not automatic synchronization. See [Connected Ideas](CONNECTED_IDEAS.md).

## Later: BuildWise backend (deferred by owner 2026-11-03)
- Design a BuildWise-managed, owner-approved gateway for ContextWise: OAuth offline consent, encrypted token custody (VaultWise or equivalent), short-lived agent grants, per-user isolation, idempotent `archive.upsert` calls, provenance, version history, audit, revocation and restore, and safe read API.
- Do **not** share Drive refresh tokens with an agent, GitHub, browser localStorage or ChatGPT chat. Never use a public Drive share link as an API.
- Coordinate the backend with the existing Firebase auth and selected-storage model once authorized. Revisit website's reader scope deliberately; avoid broad Drive scopes until justified and reviewed.

## Not yet implemented
No server-side MCP, BuildWise archive gateway, continuous cross-chat ingestion, cross-provider storage selection, encryption-at-rest under a ContextWise-managed key, or automatic webpage sync.


## Proposed Ava incremental-archive reader (feature branch, not deployed)
Owner authorization: 2026-11-04 18:10:54 UTC; canonical BuildWise bulletin thread `20b982d7-bca6-4dcc-b4bf-f976e3d868a1`.

This branch extends the existing **manually initiated** `Load archived projects` action. After the user's separate Google Drive read-only consent, it reads the latest `contextwise-workspace-*.json` (if present) and private Google Docs matching `ContextWise_Ava_Incremental_Archive_*` from the same ContextWise folder. Google Docs are exported via Drive `files.export` as text; each newline JSON record must contain an immutable bulletin source ID, timestamp, evidence classification, and summary. The import normalizes records into BuildWise timeline notes, preserves provenance, and deduplicates bulletin message IDs already represented in the workspace.

Safety boundaries: source documents stay private and are read in browser memory; the importer sends no archive text to Firebase or GitHub. Google Drive `drive.readonly` consent covers more than the folder and is *not* an encrypted vault. The loader fails closed rather than silently truncating more than 100 archive Docs or more than 2 MB total incremental text. Browser OAuth still expires with the session; no unattended backend or automatic website synchronization is claimed.

Verification: `npm run verify` passed 39/39 tests on an isolated read-only testing clone of the feature branch (2026-11-04). **Still required:** independent security/code review, signed-in owner import and wrong-account/denial/revocation tests, browser UI inspection, explicit deploy approval with rollback, and production evidence. Passing unit tests is not feature certification.
