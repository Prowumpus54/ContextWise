# Security and privacy — no production claims

## Present reality
P0 is a **prototype**, not a secure vault:
- JSON imports are read into memory, never persisted by application code.
- No network requests, telemetry, AI calls, logins, or secrets are required by application code.
- Exported context is plaintext and may contain anything the user imported.
- The local development server binds to 127.0.0.1, not the LAN.
- A static code-hosting platform may have its own logs and policies. Publishing the UI does not create end-to-end privacy guarantees.

## Threats requiring design and tests before stored real data
Malicious imports/XSS, device compromise, extension access, lost/forgotten recovery keys, malicious browser dependencies, unauthorized exports, stale authorization, replay attacks, corrupted backups, and secrets mistakenly placed in the search index.

## Planned controls — not yet implemented
Vetted authenticated encryption and key derivation; clear local/unlock boundaries; authenticated access and recovery policies; backups with integrity checks; separation of searchable metadata and encrypted data; key rotation; fail-closed grants; explicit user-approved sharing; security tests; independent review.

## Important design rule
A mnemonic/passphrase cannot guarantee automatic destruction of every vault copy. Losing the only decryption key may make data irrecoverable; require an intentional recovery design. Do not copy native Windows DPAPI/CNG credential code into browser JavaScript. Never call unreviewed browser crypto a replacement for an audited security system.
