# Architecture

## P0 implemented
`web/index.html` + `styles.css`: browser surface.
`web/src/validate.mjs`: bounded import validation; all imported data is untrusted.
`web/src/model.mjs`: zoom and query filtering.
`web/src/context.mjs`: deterministic project-scoped plain-text handoff.
`web/src/app.mjs`: DOM updates and explicit file operations.
`web/src/demo.mjs`: synthetic-only history.
`scripts/dev.mjs`: localhost-only development static server.

No service worker, remote network API, database, analytics, authentication, or persistence is present.

## Future planned (not implemented)
Browser UI → application/controller → encrypted local vault + metadata/index → timeline & retrieval → explicitly authorized sharing/export.
Security decision required before choosing browser-only WebCrypto, an audited crypto library, passkeys, or an optional local helper.

## Source of truth
Imported source records retain stable IDs and provenance; synthesized status must not overrule verified source events. Future AI summaries should carry source citations and confidence, not silently rewrite history.
