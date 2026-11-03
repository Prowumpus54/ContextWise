# Changelog

## 2026-11-03 — Integration into main (Git merge)
- Merged previously deployed Firebase/Google authentication, storage preference, Drive connection and diagnostics changes from the feature branch.
- Merged Connected Ideas graph and optional schema v1 relationships; BuildWise/Tasker/VaultWise/Atlas/ContextWise private combined archive remains in the owner's Google Drive, not the public repository.
- Integrated the repository Archivist skill and the main-branch engineering standards/feature inventory.
- Updated data, architecture, security, current state, tests, release checklist and feature documentation to distinguish verified functionality from outstanding owner-authenticated E2E checks.
- Removed hardcoded personal Drive folder/file IDs from current reusable skill and public docs; prior Git history remains immutable.
- Backend, encrypted vault and continuous ingestion remain deferred/unimplemented.

## 0.1.9 — Connected Ideas / BuildWise reader (deployed prior to merge)
- Interactive project/event relationship graph, keyboard-oriented graph nodes and linked idea navigation.
- Explicit `Load archived projects` action requests separate read-only Google Drive permission and reads validated workspace JSON into tab memory.
- Schema v1 optional typed `relations` extension and regression tests.
- Google Drive connector-created combined archive verified privately. Do not equate Drive metadata verification with a signed-in browser import smoke test.

## 0.1.5–0.1.8 — Firebase authentication/Drive reliability
- Fixed shared Firebase authentication module, event subscription, and release-version module caching.
- Added privacy-minimized diagnostic reports and Google Drive API reason reporting.
- Verified Google sign-in, saved Drive preference, and Drive folder connection via user-supplied diagnostics.

## 0.1.0 — Initial P0 scaffold
- Repository structure, WiseCore-style docs and CI.
- Sample project timeline, milestone/decision/detail modes, search and inspector.
- Validated JSON import in memory, project-scoped plain-text export and Node tests.
- No secure vault implementation.
