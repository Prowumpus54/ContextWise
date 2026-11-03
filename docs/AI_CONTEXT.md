# ContextWise agent bootstrap — 2026-11-03

Canonical branch: `main`. Read `CURRENT_STATE.md`, `INDEX.md`, `STANDARDS.md`, `FEATURES.md` and `AUDIT_2026-11-03.md` before code changes. Trust observed source/tests rather than outdated branch status prose.

The deployed **v0.1.9 public prototype** has Firebase Google sign-in, storage preference, Drive folder connection, an explicit separately consented Drive archive loader, bounded schema v1 JSON with optional event relations, an interactive Connected Ideas map and project-scoped text export. A ChatGPT connector Archivist can write validated JSON to the user's private Google Drive folder on request. The reader is *not* automated and has not yet passed owner-authenticated E2E verification.

No encrypted vault, persistent secure backend, unattended Archivist process, MCP server, continuous sync, or provider adapters beyond Google Drive are implemented. The BuildWise backend was deferred by the owner. Do not store private project histories, credential values or personal folder IDs in Git.

Core source: `web/`, schema validation: `web/src/validate.mjs`, graph: `web/src/graph.mjs`, browser Drive: `web/src/drive.mjs`, archivist procedure: `.agents/skills/contextwise-archivist/SKILL.md`. Acceptance: `npm run verify` plus applicable browser and OAuth tests. For private-production readiness, follow `SECURITY.md` and `STANDARDS.md`.
