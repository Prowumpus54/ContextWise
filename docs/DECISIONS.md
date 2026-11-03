# Decisions

- 2026-11-02 CW-ADR-001: Web-first human project timeline is P0. MCP is deferred to P1.
- 2026-11-02 CW-ADR-002: Use dependency-free browser modules initially for portability and easy inspection; revisit framework after UX requirements.
- 2026-11-02 CW-ADR-003: No plaintext persistent store for private project content; keep demo/import in-memory until security design is reviewed.
- 2026-11-02 CW-ADR-004: Adopt WiseCore documentation standards but do not transplant Windows-specific VaultWise credential implementation into browser.

- 2026-11-03 CW-ADR-005: Use ChatGPT's connected Google Drive plugin as the explicit-run Archivist writer; defer BuildWise backend, credential broker, MCP and unattended ingestion pending separate approval.
- 2026-11-03 CW-ADR-006: Introduce optional schema v1 cross-project event relationships for Connected Ideas without claiming a complete graph v2 or verified causality.
- 2026-11-03 CW-ADR-007: Browser may request separately consented Google Drive read-only access to load a combined private workspace on demand; recognize broader-than-folder permission as a temporary risk, not automatic sync or production security acceptance.
- 2026-11-03 CW-ADR-008: Consolidate v0.1.9 development and engineering standards onto main, keeping private Drive IDs out of current public docs and preserving historical commit provenance.
- 2026-11-03 CW-ADR-009: Add decision-linked project conversations. The initial v0.1.11 transport is only a same-browser-profile, signed-in, local-tab preview with explicit handoff copying. Real external ChatGPT/BuildWise agent messaging requires new authenticated relay, message storage and separate owner-scoped authorization, not a silent Firebase chat database.
