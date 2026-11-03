---
name: contextwise-archivist
description: Source-grounded ContextWise archive writer using the user's connected Google Drive and GitHub connectors. Create, validate, upload and verify project-history JSON without asking the user to manually post files.
---

# ContextWise Archivist — ChatGPT connector mode

## Authority and limitations
- This is a **repository workflow** for agents that can use the user's *already-connected* Google Drive plugin. It is not an installed ChatGPT global skill or a permanent autonomous process.
- This is the current writer path. There is **no ContextWise API, service account, backend, background daemon, webhook or refresh-token broker**.
- Never send refresh tokens or access tokens to chat, GitHub, Firebase, a URL in a source document, or the archive.
- When the user requests archiving a project, conversation, or a set of sources, do not ask the user to download, copy or paste JSON. Generate it and upload directly using available authenticated tools.
- Do not indiscriminately ingest unrelated personal conversations or private sources. Scope collection to the requested project, cite evidence, do not invent facts, and obtain authorization where required by the source/service.
- Connected app authorizations may need reauthorization. This workflow only runs when the user invokes it in a chat/Work agent or explicitly sets up an approved scheduled task.

## Destination (confirmed 2026-11-03)
- Google Drive folder: `ContextWise`
- Folder ID: `17fKZlQDIdD8HR6Wi2bQq5jzUfT8p3JfK`
- Preferred Library path: `/Google Drive/ContextWise`
- Folder address: https://drive.google.com/drive/folders/17fKZlQDIdD8HR6Wi2bQq5jzUfT8p3JfK
- Example verified archive: `tasker_complete_development_history_contextwise.json` (legacy root snapshot, successfully uploaded). It must not be silently overwritten or renamed.
- Do not assume the folder belongs to any other user; re-confirm target Google account/folder when identity differs or the connected app is unavailable.

## On each archive request
1. Read this skill, `docs/DATA_MODEL.md`, `web/src/validate.mjs` and current connected app capabilities. Read source files/chats/repos with permission; distinguish user discussions, proposed changes, commits, tests, deployed builds, and unresolved issues.
2. Produce valid `schemaVersion: 1` JSON with `projects: [{id,title,description,events}]`; each event has `id,date,type,title,summary,sourceRefs`. Types: `milestone|decision|blocker|note`. Stable event IDs; ISO calendar dates; evidence URLs or clear discussion references. No fabricated evidence, secrets or personal credentials.
3. Validate with `normalizeWorkspace` from `web/src/validate.mjs` or a faithful equivalent. Observe the web import's 2 MB size limit, max 100 projects, max 5,000 events/project, max 12 refs/event, and ID restrictions. Split archives logically if needed.
4. Read the destination folder **before writing**. Resolve an existing file by verified Drive file ID; never pick the wrong account or overwrite older content without verification.
5. If a same-project file exists, prefer updating the *same Drive file ID* using the Google Drive plugin's `update_file` with an authenticated connector `file_uri`, only when that exact file-reference workflow is supported and can be verified. If no supported in-place content update is available, write a dated immutable snapshot with an unambiguous filename, e.g. `contextwise-tasker-20261103T031900Z.json`. Do not claim in-place updating succeeded when only a new file was uploaded.
6. For a conversation/Library file already available by exact `file_id`, use `files__manage_library` with `operation:"upload"`, `source_file_ref:{file_id}`, `destination_path:"/Google Drive/ContextWise/<filename>.json"`. For newly generated JSON, create a real verified file first, then upload it through this same route. Alternatively use the Google Drive plugin's `upload_file` only if the source is an accepted authenticated connector `file_uri`.
7. Verify by Google Drive metadata/readback (file name, size, MIME type, destination parent ID). Report the actual link/ID and whether the JSON was newly created or updated. An upload response alone is not a claim that the website has loaded the archive.
8. If Google Drive is disconnected, report the blocker and offer to reconnect it. Never fall back to writing history to an unapproved account, public URL or Git repo.

## Important reader boundary
- The **website's** OAuth uses the limited `drive.file` scope and a session-only access token, separate from the ChatGPT Google Drive connector. Files uploaded by the connector may not be discoverable/readable by the website under `drive.file` just because they are in the same folder.
- The current website's timeline starts with synthetic demo data and only displays user-selected JSON locally. Therefore direct-to-Drive archivist writes do **not yet** update the website automatically.
- The future BuildWise backend should implement a verified broker, owner-scoped delegated authorization, audited ingestion, versioning, idempotency, and a safe website reader. Do not bypass this with public share links or hardcoded secrets.

## Completion format
Provide the archive's project/topic, event count if verified, precise Drive destination, whether the operation was create/update/versioned snapshot, and any unresolved source-coverage or website-display limitation. Do not announce success before verified readback.
