# Diagnostics

Current prototype has visible status text for successful/rejected import and exported file confirmation. There is no telemetry, event database, logging agent, or network reporting.

Future diagnostics should distinguish: loaded, parsed, validated, rejected, persisted, encrypted, unlocked, exported, and shared. Avoid writing source text, secrets, or recovered plaintext to logs.
