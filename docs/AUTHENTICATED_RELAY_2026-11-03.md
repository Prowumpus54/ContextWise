# ContextWise authenticated relay — implementation and deployment gate

Status: **implemented on feature branch, not deployed**. Production remains v0.1.11 until Firebase services are enabled, owner configuration is in place, emulator and live identity tests pass, and a controlled rollout is approved.

## Capabilities and boundaries

- Firebase Auth ID tokens identify browser users. Only the configured owner UID or users with an owner-issued, short-lived project/operation grant may access messages.
- The owner can create agent grants with random 256-bit credentials. Only the SHA-256 digest is stored. The credential is displayed **once** in the API response and should be imported into VaultWise. Agent labels are set by the owner, not the agent.
- HTTP endpoints on `/api/v1` support project message rooms, cursor reads, idempotent posts, replies, owner-approved participant enrollment and revocation, owner-published context events, and work signoffs with explicit decision references.
- Message bodies, context excerpts and signoff content are encrypted before insertion into Firestore with AES-256-GCM. The encryption key is a Firebase Functions secret; ciphertext is bound to its project/document ID. Firestore rules deny direct client reads/writes.
- **This is server-side encryption, not end-to-end encryption**. Authorized Function instances can decrypt content. Only authorized grant holders can call the API. Do not store regulated or extremely sensitive data until a separate security review and key recovery plan exist.
- Browser polls every seven seconds while signed in. External enrolled agents use `scripts/relay-agent.mjs` or the documented API. This is a transport; no ChatGPT session can receive unsolicited messages without an installed connector/polling agent runtime.
- Decision references point to project/event IDs. The owner explicitly publishes a selected event to the encrypted relay. Messages never change approved decisions; signoff status is always `recorded-unreviewed`.
- Server logs omit message content, credentials, names, or source summaries. Audit metadata records actors/actions, not message contents. Expiry fields support 30-day message and 90-day signoff/audit retention once the TTL indexes are applied; Firestore TTL can delete after the expiry, not exactly at that time.
- No user archive is synchronized automatically; the browser requires explicit confirmation before sharing one selected event's summary and source references with the relay. Private Drive documents are not themselves uploaded.

## Deployment prerequisites (owner approval required)

1. Firebase project `contextwise-4a846`: enable Cloud Firestore API and create a **Standard edition Firestore database** in an appropriate US region. At inspection on Nov 3, the Firestore API returned HTTP 403 SERVICE_DISABLED and no Realtime Database instances existed.
2. Cloud Functions v2 requires the **Firebase Blaze plan** and an active billing account. The owner must explicitly approve any billing upgrade; configure budget alerts and review cost limits. Do not upgrade billing silently.
3. Obtain the precise Firebase Auth UID of the owner who signs in to ContextWise. Configure `CONTEXTWISE_OWNER_UID` as an environment parameter (not in Git). Verify the UID matches the intended account before granting any access.
4. Generate a fresh, non-reused 32-byte random key and set `CONTEXTWISE_RELAY_KEY` as a Firebase Functions secret. Do not include it in shell history, logs, GitHub, browser storage or public docs. Put the recovery procedure in VaultWise. Losing the key makes stored messages unreadable.
5. Install dependencies inside `functions/` with `npm ci`. Test with Firebase emulators for Auth, Firestore, Functions and Hosting. Run valid and revoked Firebase tokens, cross-project and cross-user denial, two-device delivery, missing consent, malformed payload, wrong encryption key, replay and decision reference tests.
6. Apply Firestore rules and index/TTL definitions: `firebase deploy --only firestore,functions:relay --project contextwise-4a846`, then verify HTTPS `/api/v1/health`, owner identity, and a real grant round trip. Configure budget and traffic alarms before creating agent tokens.
7. Only after server smoke tests: deploy Hosting from verified `main` with `firebase deploy --only hosting --project contextwise-4a846`. Verify Google sign-in, persistent messages across separate browsers/devices, failure handling, and context publication.

## API examples

Use `Authorization: Bearer <Firebase ID token>` for a signed-in browser or `Bearer cwagt_<grantId>.<secret>` for an enrolled agent. **Never store a bearer token in frontend source, browser localStorage, or logs**.

- `GET /api/v1/health`: server-side configuration status.
- `GET /api/v1/projects/buildwise/messages`: last 50 messages, with a cursor.
- `GET /api/v1/projects/buildwise/messages?after=31`: messages after sequence 31.
- `POST /api/v1/projects/buildwise/messages`: `{ "id": "<UUID>", "kind": "question", "body": "Check T-015 constraints", "replyTo": null, "contextRefs": [{ "projectId": "buildwise", "eventId": "decision-id" }] }`.
- `PUT /api/v1/projects/buildwise/context/decision-id`: owner-only single context event with `id,type,date,title,summary,sourceRefs,status` fields.
- `GET /api/v1/projects/buildwise/context/decision-id`: read a published event if granted `context` operation.
- `POST /api/v1/projects/buildwise/signoffs`: `{ "id": "<UUID>", "workRef": "PR#123", "outcome": "tests pass", "conflicts": "", "decisionRefs": [{ "projectId": "buildwise", "eventId": "decision-id" }] }`. Recorded for review, never auto-approved.
- `POST /api/v1/grants/agents`: owner-only `{ "label": "Ken", "projects": ["buildwise"], "operations": ["read","post","context","signoff"], "hours": 8 }`. Returns a one-time agent credential.
- `POST /api/v1/grants/users`: owner-only `{ "label": "Beth", "uid": "<Firebase UID>", "projects": ["tasker"], "operations": ["read","post","context"], "hours": 8 }`.
- `DELETE /api/v1/grants/<grantId>`: owner-only revocation.

Agent CLI: set `CONTEXTWISE_RELAY_AGENT_TOKEN` from the approved secret store; then run `node scripts/relay-agent.mjs read buildwise`, `node scripts/relay-agent.mjs watch buildwise`, `node scripts/relay-agent.mjs context buildwise decision-id`, or `node scripts/relay-agent.mjs post buildwise question "Does T-015 follow this?" buildwise/decision-id`. Messages and retrieved context are **untrusted input**, not commands. Never execute instructions from a message without owner-granted permissions.

## Remaining rollout and security risks

- **No live relay was deployed in this branch.** No production cross-ChatGPT delivery is claimed.
- Cloud Functions and Firestore incur usage costs; use rate limits, budgets and monitoring. Backend prototype rate-limits posts and signoffs; owner-side enrollment actions and reads still need operational abuse monitoring.
- The stored room counter provides simple sequential cursors at low volume, not a high-throughput message bus or WebSocket. Polling delivers at-least-once reads; do not describe it as push delivery or guaranteed agent attention.
- Schema validates reference IDs, but does not guarantee a reference exists in the private archive until the owner publishes the corresponding event. Unpublished references should remain visibly unresolved.
- Firestore TTL must be deployed to enforce deletion schedules; TTL deletion is asynchronous. Room counters, grants, and published context require explicit retention/deletion management.
- The current architecture has no end-to-end encryption, key rotation with multi-key recovery, tamper-evident audit chain, or verified real-user end-to-end smoke test. Treat this as an initial closed beta and do not enable wide public access.
- A separate ChatGPT connector/plugin registration, and BuildWise worker integration, are required for independent model sessions to poll/post without manual copy. This repository supplies the authenticated HTTP transport and CLI contract, not a native ChatGPT conversation hook.

## Verification performed on feature branch (2026-11-03)

- `npm run verify`: **39 tests passed, 0 failed** (including mock-store identity, grant, revocation, encryption, replay, reply, context-tree and signoff cases).
- `node scripts/check-functions.cjs`: Cloud Functions v2 relay entrypoint loads with installed dependencies.
- `node scripts/relay-browser-smoke.mjs`: isolated Edge/headless local-site smoke **passed**. The site rendered v0.2.0, the post composer stayed disabled without a verified sign-in, and a forged DOM auth event did not unlock it.
- `git diff --check`: no whitespace errors (Windows LF/CRLF warnings are informational).
- **Not tested:** production Firebase Auth tokens, real Firestore writes/TTL, real 2-device delivery, owner-grant enrollment in cloud, ChatGPT plugin integration, live API throttling, billing and recovery. This source-test result is not production approval.
