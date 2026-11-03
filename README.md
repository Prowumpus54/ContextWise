# ContextWise

A web-first timeline for exploring project history, decisions and supporting evidence.

Live prototype: https://contextwise-4a846.web.app (Firebase `contextwise-4a846`).

## Current capabilities
- Google sign-in; storage preference and a Google Drive folder connection.
- Synthetic demonstration timeline with zoom, search, evidence details, and manual schema-validated JSON import.
- Local project-scoped context export and browser diagnostic reporting.
- **Archivist plugin writer:** ChatGPT can create and upload ContextWise JSON into your connected `ContextWise` Google Drive folder without you copying/pasting the JSON. This path has been verified with a Tasker development-history archive.

**Important:** The website does **not** automatically display JSON written by the archivist plugin. Its limited browser Drive authorization is separate from the ChatGPT Google Drive connection, and browser OAuth access is session-only. A secure BuildWise backend was explicitly deferred. Do not import confidential data into the browser prototype; it is not an encrypted vault.

See [Archivist skill workflow](.agents/skills/contextwise-archivist/SKILL.md), [Integrations](docs/INTEGRATIONS.md), and [Current state](docs/CURRENT_STATE.md).

## Develop

Node.js 20+; no application npm dependencies.

```bash
npm run dev
npm run verify
```

Further reading: [Documentation index](docs/INDEX.md), [Roadmap](docs/ROADMAP.md), [Security](docs/SECURITY.md).
