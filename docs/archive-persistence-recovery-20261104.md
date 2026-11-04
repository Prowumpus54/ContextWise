# ContextWise archival persistence — verified native Drive path

Status: **integration fixture passed; scheduled Ava job not yet verified** (2026-11-04).

## Failure under investigation

Ava's scheduled archival process reported `container_session_expired` on a temporary-container-backed Google Drive upload. An attempted ChatGPT Library upload using `container_path` independently returned `container_session_unavailable`. This establishes an environment-specific transfer failure, **not** loss of Google Drive authorization or archive content.

## Independently exercised safe path

1. Find the authorized, private ContextWise Drive destination via authenticated Google Drive search. Confirm folder ID, ownership and private-sharing state; never hard-code it in published source.
2. Prefer native Google Docs creation with the connected Drive API for structured, bounded incremental archive records (when the output can legitimately be a Doc), or use an authorized exported **file reference** for raw JSON/other nonnative files. Do not hand a connector an absolute transient container path from another session.
3. For OAuth-backed Google Drive, create a native Doc at root; direct create with `parent_folder_id` is rejected. Use `get_file_metadata` to ground its current parent, then `update_file` with verified `addParents` and `removeParents` to move into the authorized private folder.
4. Read the current document and its revision. Append only the new checkpoint via `batch_update_document`, passing `write_control.requiredRevisionId` so a concurrent update cannot be silently overwritten.
5. Independently read back via `get_document_text`; verify exact fixture identity, prior checkpoint content, appended checkpoint and document revision. Confirm actual parent and sharing via `get_file_metadata`.
6. Advance the external ContextWise archive checkpoint **only after** the remote content and integrity have been verified. Persist source cursor, destination file ID, revision and content/checkpoint digest in authorized durable state. Never treat an unverified response, an uploaded local file, or a successful API health check as a committed archive.
7. On revision mismatch, re-read and reconcile by stable source/event ID. Never reset a checkpoint or replace an entire historical archive without a verified backup.

## Synthetic verification performed

A private synthetic document was created and moved to the existing authorized ContextWise folder. It contained stable fixture identity `CW-ARCHIVE-RECOVERY-20261104-A`, original payload `safe-test-only`, and `checkpoint_seq: 1`. The initial readback matched. A revision-controlled append added `checkpoint_seq: 2`. Independent final readback confirmed both records and preserved payload; Drive metadata reported the authorized folder and `shared=false`.

This is **not** proof that Ava's full nightly/hourly job has adopted the method, that bulk binary uploads work, or that all archive sources and cursors are synchronized. Those are separate acceptance checks.

## Critical alternative for file handoff

The bulletin upload path was recovered without container-path access by exporting a native Google Doc as `text/plain`; the export returned a durable file reference (`file_uri.file_id`). Pass the exact exported `file_id` to ChatGPT Library's `files.manage_library` `source_file_ref.file_id` upload, rather than `container_path`. The resulting append-only bulletin JSON was independently parsed and read back.

For arbitrary raw JSON archive payloads, favor a supported export that preserves exact bytes and verify the exported content by parsing and comparing canonical IDs before upload. Native Docs formatting is not a universal binary serializer.

## Ava scheduled-job acceptance still required

- Run an actual incremental source batch with production credentials kept inside the approved connection.
- Verify source IDs, duplicate handling, checkpoint revision and archive readback end-to-end.
- Show failure/retry behavior with an intentionally stale revision without losing history.
- Record provenance in ContextWise and report to the Master Coordinator.
- Do not mark Tasker or BuildWise closed merely because this fixture passed.

## Coordination and safety

Master coordinates task ownership. Ava owns archival workflow changes. Owen independently reviews certification; Riley's SHA comparison task is separate. No credentials, protected logs, raw production content, worktree cleanup, merges or deployment are authorized by this document.
