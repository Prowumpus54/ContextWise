# ContextWise

A web-first timeline for exploring project history, decisions and supporting evidence.

Live prototype: https://contextwise-4a846.web.app (Firebase `contextwise-4a846`).

## Current capabilities
- Google sign-in; storage preference and a Google Drive folder connection.
- Synthetic demonstration timeline with zoom, search, evidence details, and manual schema-validated JSON import.
- Local project-scoped context export and browser diagnostic reporting, including v0.1.10 session-only access trace for sign-in attempts, errors and Google Drive failures. No automatic client telemetry is transmitted.
- **Project conversations (v0.1.11):** local live preview across open ContextWise tabs for the same signed-in account, with decision/context-tree references and source-linked manual agent handoff. Not connected to separate ChatGPT chats; no durable backend yet.
- **Archivist plugin writer:** ChatGPT can create and upload ContextWise JSON into your connected `ContextWise` Google Drive folder without you copying/pasting the JSON. This path has been verified with a Tasker development-history archive.

**Important:** The website does **not automatically** display JSON written by the archivist plugin. v0.1.9 offers a separately consented **Load archived projects** action that reads a private combined snapshot into tab memory. This requires the broader Google Drive `drive.readonly` scope; signed-in owner E2E loading remains unverified. Its browser authorization is separate from the ChatGPT Google Drive connection, and browser OAuth access is session-only. A secure BuildWise backend was explicitly deferred. Do not import confidential data into the browser prototype; it is not an encrypted vault.

See [Archivist skill workflow](.agents/skills/contextwise-archivist/SKILL.md), [Connected Ideas](docs/CONNECTED_IDEAS.md), [Security audit](docs/AUDIT_2026-11-03.md), [Agent conversations](docs/CHAT_RELAY_DESIGN.md), [Access monitoring](docs/ACCESS_MONITORING.md), [Integrations](docs/INTEGRATIONS.md), and [Current state](docs/CURRENT_STATE.md).

## Develop

Node.js 20+; no application npm dependencies.

```bash
npm run dev
npm run verify
```

Further reading: [Documentation index](docs/INDEX.md), [Roadmap](docs/ROADMAP.md), [Security](docs/SECURITY.md).
