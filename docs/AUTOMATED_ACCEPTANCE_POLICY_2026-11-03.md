# Automated evidence-based acceptance — proposal (2026-11-03)

## Decision and scope
The Owner has identified manual feature-by-feature approval and live testing as an unsustainable bottleneck across ContextWise, Atlas, Tasker and the Wise development workflow. For routine, reversible feature work, prefer **delegated evidence-based acceptance** over mandatory Owner sign-off. This document defines the requested policy; it does not claim the CI/CD pipeline already implements or enforces these gates.

This policy **does not** turn previous owner approval of Atlas into an unrestricted permanent grant. Treat earlier broad Atlas authorization as withdrawn for future privileged operations unless a current, explicit, scoped grant is verified. Never bypass VaultWise, provider OAuth, device install, infrastructure spending or other system-enforced approval prompts.

## Risk tiers and authority

| Tier | Examples | Required release evidence | Owner action |
| --- | --- | --- | --- |
| A: Routine / low risk | Docs, isolated UI, non-sensitive fixes, small reversible changes | CI green, lint/static tests, deterministic unit tests, PR diff audit, no secrets; stage smoke test where applicable | None per feature; approved automation may merge/deploy only where repository rules permit |
| B: Operational / moderate risk | Agent scheduling, diagnostics collectors, service integration, APK/desktop feature rollout, telemetry, compatibility changes | All Tier A gates plus integration/E2E in disposable environment or emulator, environment-specific install/deploy check, agent-independent audit, health/rollback check; canary and monitor if production is eligible | No manual feature test by default; **do not auto-release** until the pipeline is independently verified, an authorized deployment path exists, and a rollback method is exercised |
| C: Restricted / high risk | New authentication scopes, credential operations, secret handling, access broadening, external data sharing, paid cloud enablement, destructive migrations, irreversible actions, public exposure of local endpoints | Threat/security review, owner-visible scope and impact, rollback/recovery plan and logged decision | Fresh explicit scoped Owner authorization is required; approval cannot be inferred from silence or prior generic Atlas approval |

If uncertain about a tier, classify upward. Denied/cancelled requests stay denied until the Owner explicitly changes them. A routine PR passing tests is not authorization for privileged actions.

## Machine-verifiable acceptance contract
A feature may be recorded as **delegated-accepted** only if the exact git commit, build artifact digest, execution environment, tests and results, independent audit result, deployed version where applicable, rollback reference, and signed agent run ID are all linked to a stable task ID. The policy is separate from the code required to enforce it.

State transitions must distinguish: proposed → coded → committed → CI-tested → merged → built → installed/deployed → verified → delegated-accepted. For security-restricted tasks, **owner-accepted** is an additional separate state. No stage is inferred from an earlier stage.

Automated reviews must:
1. Verify tests against the exact commit and artifact being released.
2. Fail closed on missing evidence, failing tests, stale agent heartbeat, unexpected permission changes, missing rollback, broken signatures, or unreviewed diagnostics.
3. Test Android on emulator/device farm where feasible; reserve real-phone owner testing for critical UX or device-specific failures.
4. Run staging/synthetic browser tests for ContextWise and Atlas, including auth isolation, no raw secret exposure, and mobile rendering.
5. Post-deploy, observe real health signals with timestamps. An unobserved component is **unknown**, not healthy.
6. Auto-revert or stop promotion on confirmed regressions, without suppressing the original incident.
7. Archive result, source links and confidence into ContextWise and Tasker's development inbox.

## Practical implementation sequence
1. Implement evidence schema and risk classification in Tasker/BuildWise.
2. Add PR CI checks, independent agent audit and required status gates.
3. Set up disposable staging, emulator/UI tests and a controlled canary/rollback mechanism.
4. Enable automated acceptance only for Tier A after verification; progressively admit Tier B based on observed reliability.
5. Integrate read-only verified status into ContextWise and Atlas; do not make the undeployed cross-chat relay a dependency.
6. Enable auto-merge, auto-deploy or branch cleanup only after checking repository permissions, protections, and the actual automation status. Never delete unmerged, protected, default or active branches.

## Exceptions and escalation
Escalate to the Owner only for Tier C permission/financial/security decisions, ambiguous product direction that automation cannot resolve, repeated regressions, or material user-impacting failures. Batch decisions by release or permission scope where possible. Provide a short exception digest instead of requesting a sign-off for every feature.

This proposal changes **release acceptance policy**, not existing service grants, production readiness, Firebase billing settings, VaultWise keys or GitHub protection rules. Such changes must be made and verified separately.
