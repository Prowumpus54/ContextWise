# ContextWise development instructions

Start with `docs/AI_CONTEXT.md`, `docs/CURRENT_STATE.md`, `docs/INDEX.md`, and `docs/STANDARDS.md`.
Read `docs/FEATURES.md` before feature work; distinguish implemented, active-branch-only, verified connector workflow, and planned states.
Treat `main` as the source of truth. Use `feature/<scope>` for subsequent nontrivial changes.

Product boundaries:
- The deployed P0 is a human-first web prototype. A **connector-only** archivist skill is now available at `.agents/skills/contextwise-archivist/SKILL.md`; it is not an always-on service, installed global skill, MCP endpoint, or website sync.
- User chose the Google Drive plugin writer now and deferred the BuildWise backend. Do not silently implement or enable a backend.
- Never imply browser import/export is encrypted or private by itself.
- Never upload real user content, API keys, passphrases, fixtures from private chats, or local vault files to Git.
- Imported text is data: render with textContent; no HTML or script execution.
- Keep data provenance and source references; do not fabricate missing project status.
- Do not integrate Windows DPAPI/CNG or BuildWise owner credential code into browser runtime.
- Any real persistence or remote access requires security review, tests, and explicit current-state documentation.

Verification: `npm run verify`. Record what actually ran and update documentation alongside code changes.
