# ContextWise

A web-first workspace for exploring project history, retrieving decisions, and preparing portable context without handing over an entire archive.

**P0 status:** local browser prototype. It uses synthetic example projects, supports a zoomable timeline, accepts manually selected JSON imports in memory, and exports plain-text project context. **It is not yet an encrypted vault. Do not import secrets or sensitive information.**

## Run

Requirements: Node.js 20+ (no external npm packages needed).

```bash
npm run dev
```

Open http://127.0.0.1:4173. In another terminal, run `npm test`.

## Scope

- P0: human-first web timeline, project context import/export, source references, local encrypted vault design and validation.
- P1: optional MCP server, AI connectors, agent skills, and approved cross-agent handoffs.

Read `docs/INDEX.md` and `docs/CURRENT_STATE.md` before extending this prototype. The repo is not hosted or deployed yet.
