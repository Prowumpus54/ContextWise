# Reuse audit — 2026-11-02

Connected GitHub sources inspected:
- [WiseCore](https://github.com/Prowumpus54/WiseCore): project documentation standard, UI/diagnostics conventions, `schemas/buildwise-project.schema.json`. **Adopted standards** and compatible project metadata layout.
- [Factory Dashboard / BuildWise](https://github.com/Prowumpus54/-factory--dashboard): `public/styles.css` timeline/status styles, `server/provenance.js`, extensive `tests/`; **reference for timeline/provenance/tests**, not copied.
- [BuildWise System Atlas](https://github.com/Prowumpus54/BuildWise-System-Atlas): `public/index.html` graph/inspector presentation; **visual reference**, not copied.
- [BuildWise VaultWise implementation](https://github.com/Prowumpus54/-factory--dashboard/tree/main/server): `credential-vault-crypto.js` uses AES-256-GCM with bound AAD and wrapped DEKs; `credential-vault-policy.js` uses scoped fail-closed grants; `credential-vault-audit.js` uses a hash-chain with explicit external checkpoint limitation. **Security architecture references only**. Node crypto, Windows owner enrollment, and native key assumptions are not portable browser modules.
- [BasketWise](https://github.com/Prowumpus54/basketwise): offline-first principles; suggestions require review; explicit local/sync/failure states. **Behavioral reference**, not copied.

**Actual reused code:** none. This initial ContextWise scaffold is newly written. Existing repositories were used as reference patterns. Before literal code reuse, review dependencies, history, license status, and independent test coverage.

Recommended reuse order: WiseCore docs/metadata → Factory provenance/event vocabulary → shared UI conventions → audited security design work. Do not add MCP code in P0.
