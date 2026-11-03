# Project: ContextWise

## Problem
People lose track of why projects evolved, which decisions still hold, what remains unfinished and where the source discussion or commit lives. ContextWise aims to provide a navigable, provenance-grounded, user-owned project memory.

## Current product boundary (v0.1.9)
A Firebase-hosted browser prototype offers Google sign-in, project timeline and inspector, optional cross-project event relationships, Connected Ideas map, schema-validated local import/export, and separately consented on-demand Google Drive reader. A connected ChatGPT Archivist workflow can write snapshots to the user's authorized Google Drive. There is **no** encrypted vault, continuous sync, independent backend or permanent provider authorization.

## Product rules
- Treat source references as evidence identifiers, never automatically as verified claims.
- Do not equate code commits, tests, installs and user acceptance.
- Share project context only on deliberate user action; never upload private history into public source/hosting files.
- Keep login, provider authorization and future vault unlock distinct.
- Preserve the owner's explicit decision to defer a BuildWise backend/MCP and unattended ingestion until separately authorized.
