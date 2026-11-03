# ContextWise agent bootstrap

Current work is a **web-first P0**. Read CURRENT_STATE.md, INDEX.md, then files relevant to your task.

Prototype source: `web/`; tests: `tests/`; developer server: `scripts/dev.mjs`.
Run `npm run verify` before claiming tested.

P0 focus: visualize project history and manually import/export scoped context. MCP and agent skills are deferred to **P1**.
The current prototype keeps manually imported JSON in **memory only**. It does not encrypt, persist, authenticate, synchronize or call AI providers. Don't import personal secrets.

Untrusted imported strings must be rendered with `textContent`, never `innerHTML`. Security features must have explicit threat models, key-recovery documentation, and review before any production claims.
