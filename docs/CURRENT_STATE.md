# Current state — 2026-11-03 (America/Chicago)

## Implemented and verified
- Live Firebase Hosting: https://contextwise-4a846.web.app (project `contextwise-4a846`).
- Google Firebase authentication and Google Drive folder OAuth, with a browser-only provider preference.
- Browser timeline prototype with synthetic data; manual validated JSON import and local text export.
- Client-side version and diagnostics including Firebase auth, Drive API errors and module startup.
- Google Drive **ChatGPT plugin** archive writer path is operational: `tasker_complete_development_history_contextwise.json` uploaded to `/Google Drive/ContextWise` and verified against Drive metadata.
- Connector-first archivist workflow documented in `.agents/skills/contextwise-archivist/SKILL.md`.
- `npm run verify` previously passed 14 tests for the deployed 0.1.8 UI (re-run when code changes).

## Boundaries
- ChatGPT plugin connection and website's browser OAuth are **independent**. The browser token is session-only; connecting the plugin does not make browser Drive authorization permanent.
- The website **does not auto-load** JSON. Version 0.1.9 offers an explicit **Load archived projects** button that requests the broader Google Drive `drive.readonly` permission to read the latest combined snapshot into the signed-in browser session. User-consent and private-archive read are not yet browser-verified.
- The repo skill is **source-controlled agent guidance**, not an installed always-on ChatGPT skill or a background task.
- No encrypted personal vault, brokered writer, cross-chat continuous ingestion, agent MCP service, or BuildWise gateway.
- Do not import private archives into the website without a security review.

## Next slice
1. Continue archivist imports using the connected Google Drive plugin, with schema validation, provenance and verified readback.
2. Design a deliberately scoped, user-tested reader path for archived files; keep the current manual import behavior until authorized and tested.
3. **Later, not now:** BuildWise-backed credential broker, authenticated archive API, automatic uploads and sync (see `INTEGRATIONS.md`).
