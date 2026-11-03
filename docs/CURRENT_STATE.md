# Current state — 2026-11-03 (America/Chicago)

## Canonical source and deployment
- Source of truth: `main` after the 2026-11-03 integration of the Firebase/BuildWise feature branch and existing standards docs.
- Live preview: https://contextwise-4a846.web.app (Firebase project `contextwise-4a846`), **v0.1.9**. Merging Git branches does not itself redeploy Firebase Hosting.
- Verified before merge: Firebase Hosting deployment of v0.1.9; clean headless Edge startup, version and startup diagnostics.
- Automated tests: `npm run verify` is the acceptance command. See `TEST_MATRIX.md` and `AUDIT_2026-11-03.md` for latest observed execution.

## Implemented
- Google Firebase sign-in; browser-scoped, account-keyed preference for Drive, OneDrive, Dropbox or desktop (the latter three are selection only).
- Optional Google Drive folder connection (`drive.file`); browser token stays in memory.
- Explicit **Load archived projects** action, separately requesting Google `drive.readonly` consent to locate the signed-in user's ContextWise folder and import the newest `contextwise-workspace-*.json` into the browser session.
- JSON schemaVersion 1 import validation, project selector, milestone/decision/detail filters, project-local search and inspector, plain-text context export.
- Optional schema v1 `relations` for cross-project event relationships; Connected Ideas graph, list and keyboard-operable linked navigation.
- ChatGPT connector-driven Archivist process and validated Google Drive writing, independent of the website. Verified combined snapshot: 5 projects, 93 events, 14 recorded relationships. Archive files and their IDs remain outside Git.
- Diagnostic sections for auth/storage/Drive/module loading; versioned JavaScript URLs and no-cache hosting headers.
- Synthetic demo records on initial load. No real archive is published with Firebase static hosting.

## Boundaries and unverified cases
- **The browser's signed-in, real-account read of the plugin-written combined archive has not been confirmed by user testing.** Loading requires the separate `drive.readonly` consent; that permission covers more than the ContextWise folder.
- **No encrypted vault, archive unlock, secure recovery or automatic cross-device synchronization.** Plaintext files in Google Drive rely on Drive account security. User-selected provider does not imply a fully connected provider.
- OAuth Drive tokens are session-only; the independent ChatGPT connector may persist its own authorization.
- No persistent BuildWise backend, privileged agent broker, unattended Archivist scheduler, MCP server or cross-platform AI connector was implemented.
- Demo is a public website. Private-history use is not production security-accepted until the controls and testing in `STANDARDS.md` pass.
- Relationships do not yet label inferred-versus-confirmed confidence; a line shows archival linkage, not proven causation.

## Next release gates
1. Owner-authenticated Drive consent, correct account/folder and private snapshot read, wrong-account/denial/expiry tests.
2. Evidence confidence and provenance display, deduplication, revision-safe snapshots and explicit source-status tags.
3. Least-privilege reader design, archive encryption/unlock/recovery, independent security review and mobile accessibility tests.
4. BuildWise backend only after renewed owner authorization, not as part of this merge.
