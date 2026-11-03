# Site access diagnostics — 2026-11-03

ContextWise uses **Firebase Hosting** for a public static website, **Firebase Authentication** for Google sign-in, and an optional, user-consented **Google Drive** archive reader. There is no custom backend. Two different access diagnostic layers are available.

## 1. Browser troubleshooting — v0.1.10 (implemented)

Open the live website, expand **Diagnostics**, and use **Copy diagnostics**. The report now includes an `accessDiagnostics` object with:
- Page visit/open timestamp for that browser tab; up to 16 recent event *categories and status codes*.
- Counts of Google sign-in actions, successes, failures and canceled popups.
- Google Drive connection attempts/failures, archive-load attempts/failures, failed browser resources, and startup/module/runtime errors.
- Last operation/status without user identity, private URLs, email addresses, IPs, OAuth tokens or archive contents.

**This is a local troubleshooting recorder, not an owner-facing visitor dashboard.** Nothing in `accessDiagnostics` is transmitted, saved in localStorage or persisted to Firebase. It sees only events in the browser session **after the website's HTML and JavaScript load**. If the visitor cannot load the site at all, these diagnostics cannot run.

## 2. Hosting request visibility — optional Firebase Cloud Logging

To see actual site requests across visitors **without building a ContextWise server**, the Firebase project Owner/Admin can activate the supported Firebase Hosting → Cloud Logging integration.

1. Open https://console.firebase.google.com/project/contextwise-4a846/settings/integrations .
2. In **Cloud Logging**, select **Link**, then choose the `contextwise-4a846` Hosting site. Review Google's data-usage/billing and permissions dialog before linking.
3. Open https://console.cloud.google.com/logs/query?project=contextwise-4a846 .
4. Enter a filter for Firebase Hosting web requests:

```text
resource.type="firebase_domain"
logName:"webrequests"
```

To focus on failed requests, add:

```text
httpRequest.status>=400
```

For server errors only, use `httpRequest.status>=500`. Request statuses 401/403/404/5xx identify HTTP responses, **not necessarily authentication attempts**. One visitor can generate multiple requests; requests are not unique people.

Cloud Logging can record timestamp, request URL, IP address, user agent, referer, HTTP status, latency and CDN cache status. **Treat these as sensitive operator logs**, restrict Google Cloud IAM access, review retention/costs and avoid forwarding raw logs to Discord or a public dashboard. Google documents typical appearance of new requests within about 30 minutes of enabling export and default retention of 30 days. Logging activation is **not automatically performed by this repository release**, and the site cannot verify whether the Cloud Logging integration is enabled.

Documentation:
- https://firebase.google.com/docs/hosting/web-request-logs-and-metrics
- https://support.google.com/firebase/answer/9748636

## 3. Sign-in security diagnostics

Firebase Hosting web request logs show that requests reached the site/CDN. They cannot by themselves prove that a named user successfully or unsuccessfully authenticated. Per-browser `accessDiagnostics` can capture an interactive popup outcome only for that tab, without uploading it.

For centralized provider sign-in records, investigate Google Identity Platform activity logging separately, accounting for project configuration, access controls and potential billing. No auth-event ingestion service, visitor fingerprinting, IP collection script, cloud collector, tracking cookie or Identity Platform upgrade is deployed by ContextWise v0.1.10.

## 4. Known limits / release checks

- Browser diagnostics are user-copyable and in-memory only; an owner cannot remotely see another visitor's browser errors by default.
- Hosting logs are optional and must be linked by an authorized project administrator; no proof of live export until requests appear in Cloud Logging.
- Full access/security readiness still requires real signed-in tests, denied OAuth, wrong-account, revoked token, network outage, mobile/accessibility and scoped-vault security checks.
- Do not export private archive content or user email into access diagnostic events; error codes must be bounded and sanitized.
