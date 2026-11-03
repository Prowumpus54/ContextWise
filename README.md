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

## Authenticated relay candidate (v0.2.0, feature branch only)

The new `feature/authenticated-agent-relay-20261103` branch implements a Cloud Functions transport and Firestore encrypted delivery spool with verified Firebase users, owner-enrolled agent credentials, project/operation grants, revocation, durable message cursors, replies, one-time-grant issuance, owner-published decision excerpts, and decision-aware signoffs. A CLI adapter permits explicitly authorized local agents to poll, post, look up previous decisions and report work evidence.

**This is not deployed.** The live v0.1.11 preview remains unchanged. The ContextWise Firebase project lacks an enabled Firestore API and deployed Cloud Function; Cloud Functions require a Blaze billing account. No cost-bearing service has been activated. Even after API deployment, an independent ChatGPT chat requires a connected plugin/agent runtime to poll; the website cannot push into other ChatGPT threads by itself.

The encrypted Firestore records are a **temporary transport spool, not the canonical user-owned archive**. Full user history stays in the selected private Drive vault. Server-side encryption is not end-to-end encryption. Follow [Authenticated relay deployment gate](docs/AUTHENTICATED_RELAY_2026-11-03.md) before enabling or storing real data.
