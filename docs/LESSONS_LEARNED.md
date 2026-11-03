# Wise Ecosystem — Lessons Learned & New-Developer Bootstrap

**Audience:** A friend starting software development, including AI-assisted development.  
**Updated:** 2026-11-02.  
**Status:** A candid, experience-based guide, not a formal security audit or guarantee that every Wise feature is production-ready.

> **The biggest lesson:** A system claiming “done” is not the same as a verified working result. We learned this the hard way building apps, coordinating AI coding agents, and delivering Android builds to real phones.

## 1. What we built, and why it matters

The Wise projects began as practical applications and grew into an interconnected development ecosystem. The exact maturity varies by app, and prototypes, experimental integrations, and shipped functionality must not be conflated.

| Project | Purpose / important ideas | Lessons worth borrowing |
|---|---|---|
| **BasketWise** | Grocery, pantry, prices, shopping lists, barcode/receipt and camera workflows, household sync. | Mobile UI safe areas, offline-first design, duplicate control, camera/import review, Firebase rules tests, real-device verification. |
| **Tasker / FlowWise** | Central household task inbox, AI suggestions, review/approval, scheduling, and app integrations. | One authoritative inbox, idempotent ingestion, manual fallbacks, pending-versus-complete states, on-device AI boundaries. |
| **BuildWise / Factory Dashboard** | Local software factory for assigning work to agents, operating tools, testing, tracking jobs, GitHub, and delivery. | Durable job state, worker isolation, completion evidence, recovery after crash/restart, CI and deployment gates. |
| **VaultWise** | Owner-controlled credential/approval security layer for sensitive operations. | Least privilege, scoped grants, nonexportable keys where supported, audit trail, Windows Hello owner approvals; never paste secrets into prompts or repos. |
| **BuildWise System Atlas** | Interactive map of components, dependencies, and telemetry concepts. | A diagram is not live truth unless its data source is authoritative; make illustration versus live connection explicit. |
| **MoneyWise** | Household finance tools, budget bridge, desktop and Android direction. | Secrets and integration lifecycle must outlive a single app session; test real versus synthetic data carefully. |
| **LoreWise / Wayfarer** | Role-playing app and experiments with local AI and authoritative game state. | Keep LLM narration separate from deterministic state and validation; useful stress test for BuildWise workers. |
| **ViewWise, MedWise, WiseBoard, Brain Lord** | Mapping/imagery, health concepts, audio tools, and game development. | Reuse project standards and testing methods, not unreviewed implementation code. |
| **WiseCore** | Common Wise project conventions, schemas, and documentation. | Shared standards prevent every app from inventing a new set of error states, UI conventions, and integration contracts. |
| **ContextWise** | Human-first visual project timeline, future secure context vault and selective sharing. | Build the core human workflow first; do not claim sensitive storage or MCP exists before implementation and verification. |

Repository starting points: [ContextWise](https://github.com/Prowumpus54/ContextWise), [WiseCore](https://github.com/Prowumpus54/WiseCore), [Factory Dashboard](https://github.com/Prowumpus54/-factory--dashboard), [BuildWise Atlas](https://github.com/Prowumpus54/BuildWise-System-Atlas), [BasketWise](https://github.com/Prowumpus54/basketwise).

## 2. Why we started using GitHub

Before a disciplined repository workflow, AI-generated edits, local working copies, agent sessions, and repeated handoffs made it easy to lose track of **which code was the real code**. Git gives us an inspectable record of *committed* changes, branches, reviewable diffs, and a shared place to resume.

Git is **not** a complete backup of a running system. It does not automatically preserve uncommitted edits, local databases, active job queues, registered devices, signing keys, Android APK artifacts, or credentials. We learned to back up irrecoverable non-Git state separately and securely.

Practical rules:

1. Keep a canonical `main` branch; use a `feature/<purpose>` branch for changes, and review before merging.
2. Start by checking `git status`, current branch, and recent commits. Never assume a clean directory.
3. Preserve dirty work before recovery. Snapshot, diff, and branch before a destructive command.
4. Commit small coherent units with useful messages. Attach test evidence and links to the exact commit.
5. Never force-push, discard, or reset another active worker's changes casually.
6. Ignore secrets, local state, vault data, generated artifacts, and build caches; review every staged diff before pushing.
7. Distinguish “saved on disk,” “committed,” “pushed,” “CI passed,” “installed,” and “works.” They are six different claims.

A simple new-workflow example:

```bash
git status
git switch -c feature/timeline-zoom
# edit one bounded feature
npm run verify
git diff --check
git diff
git add web/src/model.mjs tests/
git commit -m "Add bounded timeline zoom behavior"
git push -u origin feature/timeline-zoom
# Open a PR and review the actual diff and test results.
```

The example commands must be adapted to the project and tools actually present. Check the remote and avoid adding accidental files.

## 3. Our most expensive mistake: trusting success labels

In an actual BuildWise persistence-repair test, a PowerShell command exited with status **1** and an error along the lines of **“Expected commitResult implementation not found.”** However, an outer wrapper reported **“TEST COMPLETE”** and marked the job complete. That was a *false positive*. The wording at the wrapper layer had hidden the failure underneath.

We also encountered a case where a remote/shell call appeared to stop while a child process continued modifying files. A returned command, an acknowledgment, or a disconnected terminal is **not** proof that the underlying job has finished.

**Fix the contract, not the wording:**

- Capture and propagate the child process's exit code and stderr.
- Track child processes and process trees, not only the shell that launched them.
- Require a result artifact with an explicit state and exact commit/build identity.
- Check the expected code change exists, tests actually ran, and no child process is left executing.
- Only mark a deployment complete after transport, integrity check, installation, launch, and functional acceptance.
- Differentiate `queued`, `running`, `blocked`, `failed`, `cancelled`, `completed`, and `verified`. Avoid using “complete” for “request accepted.”

A useful mental model is a chain of evidence:

```Request accepted
  -> worker started
  -> expected files changed
  -> tests executed and passed
  -> exact commit recorded
  -> artifact built and identified
  -> artifact deployed / installed
  -> app launched and accepted
```

Do not skip steps or silently infer downstream success.

## 4. What we learned about AI coding agents

AI agents can accelerate focused work, but **they are better treated as supervised junior developers than as unsupervised owners of an entire repository**.

Early factory tests exposed malformed edits, mismatched constructors, brittle tests, scope violations, repeated retries, and “thrashing” on very large files. Agents also sometimes declared work complete when integration or execution was missing.

The strongest workflow we found:

- Write a tiny, testable objective with files allowed, files forbidden, and a definition of done.
- Give each worker an isolated Git worktree or equally safe workspace. Use leases so two workers do not own the same files.
- Let one worker implement a bounded change; let another reviewer (human or AI) inspect diffs and tests.
- Keep deterministic state transitions, locks, permissions, file allowlists, and completion gates in normal code—not in model judgment.
- Enforce timeouts, retries with limits, process cleanup, and cancellation. Infinite retries can be more harmful than a visible failure.
- Preserve provenance: which prompt/job, worker, branch, commit, test run, and artifact produced the result.
- Run end-to-end checks after integration. Passing unit tests in a worker's branch is necessary but not sufficient.

A good starter AI task: “Update timeline filtering in this one module and add tests; leave UI, auth, and build scripts alone.”  
A bad starter task: “Rebuild the whole app, improve everything, and tell me when it's perfect.”

## 5. Why BuildWise got more complicated than we expected

BuildWise grew from “let an agent make code changes” into a software factory with a dispatcher, persistent jobs, worker profiles, local models, Git worktrees, Windows processes, tests, resource scheduling, an API, a dashboard, and release paths.

The hard parts were not code generation. They were **ownership, recovery, observability, and verification**.

Specific failures and resulting lessons:

- **Conflicting sources of truth:** Dashboard state, installed version, bridge, and runtime directories can disagree. Establish one authoritative backend/API and reconcile clients to it.
- **Dirty repositories:** Agents editing a shared checkout risk overwriting unfinished work. Use worktrees, ownership leases, and explicit recovery branches.
- **Process leaks:** A shell timeout does not necessarily kill the spawned compiler or worker. Track process trees and confirm cleanup.
- **Windows filesystem details:** Rename/write behavior can fail under Windows file locks. Use safe writes, handling for retries, and restart/replay tests.
- **Resource contention:** Gradle, local AI, emulators, ADB, and multiple agents on one machine compete for RAM/VRAM. Schedule workloads and use explicit resource locks.
- **Log and mailbox feedback loops:** Mutable runtime messages can interfere with the code that reads them. Keep immutable code separate from mutable state; batch/replay events carefully.
- **UI prototypes overstaying their welcome:** A good screenshot may still conceal dead buttons, status-bar overlap, delayed calls, and state mismatches. Test the real user journey early.
- **Passing one CI job is not passing CI:** Android builds, Firebase rules, security suites, and platform-specific tests can succeed/fail independently. Diagnose by job and commit.

The architecture principle we settled on: **the model proposes and interprets; deterministic software owns permissions, files, workflow state, artifacts, and releases**.

## 6. Road Deploy: what “ship it to my phone” really takes

Road Deploy was designed to move an Android build from the development machine to a phone when the user is away from the desk. Experiments included remote connectivity over cellular networking and a secure network path; working network reachability alone was not a completed release.

End-to-end deployment must check:

1. **Identity/authorization** — Is this the approved owner and registered device? Do not expose long-lived factory tokens to the phone or a public endpoint.
2. **Source identity** — Which repository, branch, and exact commit produced the APK?
3. **Build** — Did Gradle succeed, and was the correct variant signed appropriately?
4. **Artifact identity** — Record package ID, version, build variant, SHA-256, size, and provenance.
5. **Transport** — Can the phone retrieve the file across the actual network being used? Test cellular, not just desk Wi-Fi.
6. **Integrity and install** — Does the hash match, is the package expected, and did Android actually install it?
7. **Launch and acceptance** — Does the app open and perform its essential workflow?
8. **Recovery** — What happens if the connection drops, the install fails, the job is cancelled, or a previous version must be restored?

Incidents around initial repository bootstrap, missing Gradle wrappers, long first builds, misleading progress, device registration, and process cleanup drove this checklist.

**Status caution:** As of the October 28 backlog, Road Deploy was near feature-complete but *not fully certified* for reliability, cancellation, and rollback. Do not describe a demo transport test as a production-ready OTA/update system. Android's normal installation rules and owner approvals still apply.

## 7. Security lessons that apply directly to ContextWise

VaultWise taught us that security is much more than encryption code. We worked with owner approvals (including Windows Hello), scoped credential grants, credential lifecycle, encrypted records, and audit concepts. A browser app is a different security environment.

For ContextWise:

- Its **P0** goal is a human-first visual timeline of projects, decisions, and events—not MCP. MCP, agent skills, AI handoff integrations, and third-party connectors are **P1**.
- The initial browser prototype has **no implemented encrypted vault, authentication, persistent local storage, or backup**. Imports are in-memory; exports are plaintext. **Do not put private data in the current prototype.**
- Adopt a threat model *before* enabling persistence. Decide what must be protected from lost laptops, malicious browser extensions, a compromised web origin, leaked exports, and mistaken sharing.
- Use standard, reviewed authenticated encryption and proper key derivation/management. Do not invent a crypto scheme because a recovery phrase sounds familiar.
- A recovery phrase can restore access only if a recovery design actually exists. Loss of a sole key can make data irrecoverable; it does not magically shred every backup.
- Two-factor authentication can secure account/login flows; it is not interchangeable with encryption at rest.
- Treat imported chats/docs as hostile **data**, not instructions to execute. Render as text, validate size/schema, and preserve source references.
- Preview *exactly* what is about to be exported or shared. Once data is sent to an external AI provider, the local vault cannot control that provider's retention practices.
- Never reuse VaultWise Windows DPAPI/CNG owner-code directly in client-side JavaScript. Reuse *principles*, then independently design and test the browser boundary.
- Public GitHub docs may explain architecture, tradeoffs, failures, and progress. Never publish real keys, tokens, recovery phrases, account details, sensitive chat content, or unreviewed credential artifacts.

## 8. Learning the difference between a demo, a test, and a release

Use a verification ladder:

| Level | What you know | What you **do not** yet know |
|---|---|---|
| Source exists | Code or docs are present in Git | Whether they execute |
| Syntax/unit tests pass | Some functions behave in controlled conditions | Whether the whole app works |
| Integration tests pass | Components exchange expected data | Whether a user can finish a task |
| UI smoke test passes | The app launches and a narrow path works | Whether controls, errors, and offline cases hold up |
| Real-device acceptance passes | The target hardware and workflow worked | Whether recovery, security, and long-run use are robust |
| Release certified | Verified signed artifact, provenance, checks, rollback plan | Whether future changes will remain safe without regressions |

Record what ran, where, when, with which code and artifacts. Do not write “tested” if you only read source. Do not write “deployed” if GitHub Actions merely passed.

## 9. A beginner-friendly bootstrap path

**Day 1: Learn the repository.** Clone ContextWise. Read `README.md`, `AGENTS.md`, `docs/AI_CONTEXT.md`, `docs/CURRENT_STATE.md`, `docs/INDEX.md`, `docs/ROADMAP.md`, and this guide. Identify P0 versus P1.

**Day 2: Run the actual code.** Install Node.js 20+ and run:

```bash
git clone https://github.com/Prowumpus54/ContextWise.git
cd ContextWise
npm run verify
npm run dev
```

Open `http://127.0.0.1:4173`. Current setup has no external npm dependencies. If a command fails, keep the terminal error and determine whether it is environment, syntax, test, or app behavior—do not mask the failure.

**Day 3: Trace a feature.** Follow a synthetic project event from `web/src/demo.mjs` through validation and model/filter logic to the timeline UI. Understand where it gets displayed and how plaintext export is generated.

**Day 4: Make a harmless improvement.** Pick one clear UI or test gap. Create a feature branch, add a small test, run verification, inspect the diff, commit, and open a reviewable PR.

**Day 5: Practice the recovery drill.** Create an intentional failing test in a throwaway branch. Confirm CI fails. Fix it. Then simulate interrupted work and recover without deleting another person's changes.

**Week 2: Try the real product question.** Can someone return to a project after weeks away, see milestones, inspect sources, and create a short accurate context summary? Measure time-to-resume and retrieval mistakes. Do **not** solve this by adding MCP before P0 works.

## 10. A reusable task handoff template

Include this in an issue, PR description, or agent prompt:

```Objective:
Why this matters to the user:
Current confirmed state (with source/commit):
Allowed files / forbidden files:
Acceptance criteria (observable behavior):
Tests to add/run:
Privacy/security considerations:
Known failure modes:
Expected outputs (branch, commit, screenshots/logs as applicable):
What is explicitly OUT of scope:
```

After a task, append a factual outcome record:

```Outcome: verified / partially verified / failed / blocked
Commit / branch:
Tests executed and results:
UI/device checks executed and results:
Artifacts or links:
Changed behavior:
Unresolved issues / next action:
```

This format is especially important when AI agents take over across sessions. It prevents the next session from treating a confident summary as objective proof.

## 11. Apply these lessons to ContextWise

**P0**: Make a great, truthful, human-navigable timeline with zoom, project scoping, source-linked decisions, reviewable imports, and accurate context exports. Add secure local persistence only after a reviewed security plan and meaningful tests.

**P1**: Add MCP, agent skills, and optional cross-provider sharing *after* a reliable vault and selective handoff workflow exists.

The best product differentiation is not “AI remembers everything.” It is **“You can tell what happened, what is still true, why decisions were made, and what you choose to share next.”**

## 12. Reading map and original source references

- [ContextWise current state](CURRENT_STATE.md), [roadmap](ROADMAP.md), [architecture](ARCHITECTURE.md), [security design](SECURITY.md), [testing matrix](TEST_MATRIX.md), [known issues](KNOWN_ISSUES.md).
- [Reuse audit](REUSE_AUDIT.md): what was inspected in other Wise repositories, and what was *not* copied.
- [BuildWise / Factory Dashboard](https://github.com/Prowumpus54/-factory--dashboard): worker/orchestration and VaultWise implementation references.
- [WiseCore](https://github.com/Prowumpus54/WiseCore): shared standards and documentation conventions.
- [BuildWise Atlas](https://github.com/Prowumpus54/BuildWise-System-Atlas): visualization reference, but verify whether a given panel is illustrative or live.
- [BasketWise](https://github.com/Prowumpus54/basketwise): real mobile development, UI, CI, and sync lessons.

The guide summarizes observed incidents and design conclusions across development conversations and repositories. It is **not** a complete chronological incident log; where a behavior was only planned or partially tested, it is described as such. Update it when new tests disprove an assumption. That is not embarrassing—it is the entire point of documenting lessons learned.
