# Test matrix — v0.1.10 site access diagnostics (2026-11-03)

| Check | Method | Result |
|---|---|---|
| Node syntax and unit tests | `npm run verify` in integration worktree | **Passed: 24 tests, 0 failed; JS syntax check passed**, Node v24.22.2 |
| JSON schema v1 validation | Unit tests for event IDs/dates/type, duplicated/invalid/dangling relations, legacy archives | Automated coverage |
| Project scope and context export | Existing unit tests | Automated coverage |
| Dependency/module release wiring | Versioned module URL tests and local-server allowlist tests | Automated coverage |
| Google Drive API error privacy | Sanitized error parser tests | Automated coverage |
| Browser access diagnostics | 4 tests for bounded event counts, sanitized error codes, missing resource/error capture and no automatic network telemetry | Passed |
| Owner Cloud Logging | Hosting request export integration requires Firebase project admin to link and verify | **Not activated or verified** |
| Private reader wiring | Tests for explicit click, read-only OAuth scope and no static archive bundling | Automated source contract; not authenticated E2E |
| Local browser startup | Fresh headless Edge on loopback, diagnostics/version/graph | **Passed v0.1.10**; access trace initialized, runtime errors 0, promise rejections 0, module errors 0 |
| Deployed browser startup | Fresh headless Edge v0.1.9 | Passed before merge |
| Firebase Hosting release | `firebase deploy --only hosting` to `contextwise-4a846` | v0.1.9 deployed; main merge is Git-only |
| Signed-in Google Drive archive import | Owner browser popup consent then load | **Not verified** |
| Multi-device private data, OAuth revocation, incorrect account | Manual/integration security tests | **Not verified** |
| Encrypted-vault threat model, recovery and tamper tests | Future implementation | Not implemented |
| Accessibility and mobile manual smoke | Keyboard/mobile/reader | Not independently verified |
| Private archive in Git or static web | Repository file scope review | No intentional archive JSON bundled |

No assertion of release security acceptance follows solely from Node tests. See `STANDARDS.md`.
