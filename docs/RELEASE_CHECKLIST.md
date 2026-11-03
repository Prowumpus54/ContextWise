# Release checklist — ContextWise v0.1.11 / project conversation preview (2026-11-03)

- [x] Main and feature branch histories reviewed; preserved both parents using a merge commit
- [x] Merge conflict check; no unresolved paths
- [x] Browser prototype/import, graph and OAuth source code included on the integration branch
- [x] Reproducible syntax check and unit suite (`npm run verify`) run (31 pass); observed outcome in TEST_MATRIX
- [x] Fresh unauthenticated headless Edge smoke checked v0.1.9 module loading, diagnostics and Connected Ideas surface (zero JS errors)
- [x] Firebase Hosting deployment of v0.1.9 previously verified, not tied to main merge
- [x] No private archive JSON intentionally added to Git or Firebase Hosting; reusable skill no longer hardcodes personal Drive IDs
- [x] Security and known issue boundaries updated; no claim of completed private vault
- [x] Local browser smoke: project room, decision attachment controls, existing auth/Drive modules and zero startup JS errors
- [x] Isolated three-tab browser transport smoke with simulated identities: same-account delivery worked, different-account channel excluded; does not verify real Firebase auth
- [ ] Real Firebase sign-in, cross-browser/device and cross-user authorization E2E smoke
- [ ] Signed-in owner Google Drive `drive.readonly` consent and real archive import E2E smoke
- [ ] Wrong-account, denied consent, expired-token and revoked access E2E cases
- [ ] Manual keyboard/mobile screen-reader review across project and event graph navigation
- [ ] Production private-data encryption/unlock/recovery and security assessment
- [ ] Versioned write reconciliation, content-size enforcement and multi-device restore

**Release classification:** public prototype with optional manually initiated reader. **Not production-approved for confidential archives.** Do not claim uploaded Drive JSON is served publicly or that a separate BuildWise backend exists.
