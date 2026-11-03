# Diagnostics — deployed v0.1.9

The website's expandable Diagnostics panel includes version/build, signed-in/signed-out state without account identity, storage preference state, Drive button/connection status, JS module startup errors, and bounded error codes. It does **not** intentionally log OAuth tokens, email, archive JSON or private source text.

The Drive diagnostic section also reports `archiveLoad`, `archiveProjectCount`, `archiveRelationCount`, the last Drive operation and safe API status/reason strings. Click **Refresh diagnostics** or **Copy diagnostics** in the live site after a failure; do not paste OAuth tokens or browser cookies.

A correct signed-out headless smoke test loads the auth/storage/Drive modules without proving Firebase sign-in or live Drive read permission. A Drive-connected status alone does not prove JSON was imported. A successful archive load must show `archiveLoad: loaded`, a user-visible loaded count and live project list change.

No server-side telemetry database, autonomous logging agent, user-account trace export, encrypted storage or cloud synchronization is implemented.
