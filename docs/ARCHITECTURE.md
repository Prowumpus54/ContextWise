# ContextWise architecture — observed v0.1.9

## Running architecture

- Firebase Hosting serves public, static HTML/CSS/JavaScript; no private archive JSON is bundled.
- Firebase Authentication provides Google identity. The site handles `contextwise:auth` events and stores only an account-keyed **storage preference** in browser localStorage; this is not a synced vault.
- `web/src/drive.mjs` requests `drive.file` for a dedicated folder and, for the explicit **Load archived projects** action only, a separate `drive.readonly` access token via a Google consent popup. Tokens remain in module memory, never in Git or localStorage.
- Reader selects a `ContextWise` folder from the authenticated Drive response, lists `contextwise-workspace-*.json`, and imports the newest qualifying file into tab memory. It does not post archive contents to Firebase. The broader reader scope is a documented interim trade-off.
- `web/src/validate.mjs` normalizes schemaVersion 1 projects/events and optional typed cross-project relations; rejects invalid IDs, dates, dangling references and excess counts.
- `web/src/app.mjs` owns project/event selection, timeline, search, inspector, and export. `web/src/graph.mjs` derives connected projects/events; DOM and SVG labels use textContent.
- Google Drive plugin plus ChatGPT Archivist procedure (.agents/skills/contextwise-archivist/SKILL.md) is a **separate, explicit-turn writer**, not a background service or website API. Private snapshots are kept in the user's Drive account.
- `scripts/dev.mjs` is a loopback-only local web server with an allowlist and CSP. Firebase Hosting serves the same static `web/` assets in production.

## Boundaries
Signing into Firebase is not permission to access a Drive folder; signing into Drive is not vault unlock. Files written by the ChatGPT plugin are not necessarily readable using the site's `drive.file` scope. The separate `drive.readonly` reader requires deliberate consent and has not yet passed a signed-in owner E2E smoke test.

## Future — not implemented
Portable encrypted user-owned vault, provenance/relationship confidence schema v2, idempotent ingestion and merge review, provider adapters for OneDrive/Dropbox/desktop, optional BuildWise token broker, MCP read API, per-client grants and audit. Never treat design sketches as deployed functionality.
