# ContextWise agent conversation fabric — v0.1.11 groundwork

Owner goal (2026-11-03): active conversations/agents should be able to communicate bidirectionally **and** retrieve the context tree, past decisions and source evidence so those decisions influence their ongoing work.

## What v0.1.11 actually implements
- A Project conversations panel in the website (below Connected Ideas), attached to the selected project timeline.
- Same-account, same-origin **same-browser-profile, open-tab** messages over `BroadcastChannel`. Messages are in memory only and are dropped when the participating tabs close. Different devices, disconnected sessions and separate ChatGPT conversations **cannot receive messages**.
- No chat messages are stored in Firebase, GitHub, browser localStorage, Cloud Logging, Drive or BuildWise.
- Text messages with kinds `question`, `proposal`, `work-update`, `evidence`, a temporary per-tab author ID, a self-described display name and an optional `replyTo` message ID.
- Each message can reference an existing event from the selected project or a linked event from another project. Decisions and source references are displayed as text in the context inspector and can be navigated to.
- **Discuss this decision / event** action from a selected timeline event; **Copy agent handoff** produces an explicit, human-reviewed JSON context packet containing the selected event's title, date, summary and source references, plus up to eight recent in-memory messages in the room.
- Source references and recorded messages are advisory. A participant label is **not** a VaultWise or ChatGPT identity. A chat reply never silently edits the authoritative decision tree.

## Verification of v0.1.11
- `npm run verify`: 31 tests passed, zero failures, including strict message/context reference and handoff validation.
- Fresh Edge headless startup: v0.1.11 loaded Project conversations and existing auth/Drive modules with zero module/runtime/promise failures.
- Isolated Edge profile, three browser tabs, **simulated account identity events only**: messages arrived in a second same-identity tab and were absent from a different-identity tab. This verifies local channel routing, not authenticated Firebase identity, real external ChatGPT delivery or cross-device operation.

## Security limits of the local preview
- Uses only same-origin browser channels, scoped by the Firebase account UID in the local channel name. This is browser-side compartmentalization, **not authenticated inter-agent delivery**. Another page running script under this origin would have equal privileges.
- Explicit signed-in state controls posting; auth account changes clear all local message history and close the old channel.
- The browser is **not a secure encrypted vault**; do not use the preview for confidential project histories or secrets. ContextWise does not guarantee message delivery, durable history, offline replay, or external agent access.
- Content and source summaries are copied only when the user clicks Copy agent handoff; no prompt or source data is transmitted to a model automatically.
- Incoming messages are schema-checked: stable IDs, a known project and decision ref, allowed intent, bounded plaintext length, valid UTC timestamp, and up to three context refs.

## Proposed authenticated relay (not yet implemented)
A real ChatGPT-to-ChatGPT, Ken/Beth/Ava-to-ChatGPT, or BuildWise-to-ContextWise channel requires a **server-side, owner-authorized broker**, or a securely connected plugin capable of posting to an agent-accessible queue. Independent ChatGPT sessions cannot discover or message arbitrary other ChatGPT conversations directly through the current website.

The broker should be a provider-neutral transport, not the source of truth for project content:
1. **Identity:** Firebase identifies users; VaultWise or authorized agent enrollment identifies named agents. Keep the owner as Admin; don't trust a submitted `actorLabel` or an agent's own claim.
2. **Grants:** Each client gets project/thread/operation/time-scoped permissions. Revocation, expiry, rate limits and cross-user isolation must be tested.
3. **Storage:** Preserve message bodies, audit and decision references in the user's selected **private encrypted ContextWise vault**. Do not put private chat content into Firestore/Auth metadata or a public GitHub repository. The broker may keep only necessary delivery metadata.
4. **Transport:** Use authenticated `POST /v1/rooms/{roomId}/messages`, `GET /v1/rooms/{roomId}/messages?cursor=...` and SSE/WebSocket subscription; validate idempotency keys, strictly ordered cursors, retry/replay, explicit recipient acknowledgement and bounded message sizes.
5. **Context retrieval:** read-only `resolve_context(projectId,eventIds,depth,budget)` provides stable event IDs, citations, state, supersession chain, evidence confidence and related decisions, only for authorized scope.
6. **Work influence:** Before a queued agent job, broker supplies an *explicitly bounded, provenance-linked context packet*. The agent signs off with exact `decisionRefs` consulted, mentions conflicts, and links its resulting PR/test/job evidence. That work result can become a new event only after authorized review/acceptance.
7. **Reply threading:** Message envelope contains `id,threadId,senderPrincipal,recipientPrincipals,replyTo,projectId,decisionRefs,kind,createdAt,body,sourceRefs,idempotencyKey,deliveryStatus`. Claimed display names are separate from verified principals.
8. **Decision authority:** Distinguish `proposed`, `disputed`, `approved`, `superseded`, `rejected`. Chat traffic must never promote a proposed action to an owner-approved decision merely because agents agree.
9. **Risk controls:** Avoid prompt-injection-induced tool calls by treating chat as untrusted context. Require owner approval for privileged work; never expose OAuth/refresh tokens or private vault keys. Add deletion/retention and safe archive export rules.

### Delivery milestones
| ID | Status | Gate |
|---|---|---|
| CW-CHAT-001 | Implemented in v0.1.11 (local preview) | Project room, reply, linked decisions, handoff copy; automated/browser smoke |
| CW-CHAT-002 | Planned | Provenance/confidence model for every decision link, supersession review |
| CW-CHAT-003 | Planned | Authorized private message store and encryption/recovery design |
| CW-CHAT-004 | Planned | Agent identity, scoped grants, authenticated broker and audited API |
| CW-CHAT-005 | Planned | Cross-chat streaming, delivery acknowledgement, retries, idempotency |
| CW-CHAT-006 | Planned | BuildWise/Tasker agent job context injection and decision-aware signoff |
| CW-CHAT-007 | Planned | Multi-device, revoked/grant-denied and malicious-message security tests |

**Backend authorization boundary:** Previous owner decision deferred a BuildWise credential broker. The present message requests the chat feature but does not grant broad VaultWise or unattended credential privileges. No backend or cross-session network relay was deployed in this slice. An explicit owner-scoped backend implementation is the next required phase.

## Success example (future connected integration)
1. Ken starts a Tasker broker task. ContextWise retrieves the earlier decision requiring owner-authorized, limited agent grants and its linked VaultWise evidence.
2. Ken asks Beth in the ContextWise BuildWise room: *Does the new broker flow preserve that decision?* Message includes immutable context refs.
3. Beth examines the same source-linked tree, replies with a proposed change and cites a test/PR. Neither reply is automatically a new approved policy.
4. The owner reviews and approves the changed approach. ContextWise records a dated decision with evidence and an edge to the earlier decision.
5. Subsequent authorized agents receive the updated decision context automatically when their next job claims relevant project scope, and must record any deviations.

This is the intended difference from a generic chat room: messages can *point to existing context*, and completed work can be traced back to the decisions that influenced it.

## Update — authenticated broker implementation candidate, 2026-11-03

The prior "proposed" section describes the historical v0.1.11 plan, not the current feature-branch status. Version **0.2.0 is implemented in source on `feature/authenticated-agent-relay-20261103`**, but not merged, deployed or live-tested. Implemented code milestones: CW-CHAT-003 (server-encrypted temporary message spool and owner-published context excerpts, recovery still open), CW-CHAT-004 (Firebase ID token and owner-enrolled scoped agent authorization, audit and revocation), CW-CHAT-005 (cursor polling and idempotency, *not* WebSocket/SSE/acknowledgement), CW-CHAT-006 (agent CLI and unreviewed decision-aware signoffs, *not* BuildWise automatic job injection), CW-CHAT-007 (mock authorization tests, *not* cross-device/live sign-in tests). CW-CHAT-002 inference/supersession evidence modeling remains open.

The new Firestore spool holds only server-encrypted delivery payloads, never raw conversation text; it is not the canonical selected Drive archive. This requires explicit privacy approval before enabling real data under STANDARDS.md. Separate ChatGPT sessions still require their own connected client or plugin. See [full implementation and release gate](AUTHENTICATED_RELAY_2026-11-03.md).
