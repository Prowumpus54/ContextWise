// ContextWise diagnostics v0.1.8. No tokens, email addresses, user IDs or archive contents.
const VERSION = "0.1.8";
const build = "2026-11-03.5";
const version = document.getElementById("app-version");
const output = document.getElementById("diagnostics-output");
const copy = document.getElementById("diagnostics-copy");
const refresh = document.getElementById("diagnostics-refresh");
version.textContent = `v${VERSION} · ${build}`;
const errors = [];
function safeCode(value) {
  const s = String(value || "unknown");
  return /^[a-z0-9/_-]{1,80}$/i.test(s) ? s : "redacted";
}
window.addEventListener("error", e => { errors.push({ type:"runtime", code:safeCode(e.error?.code || e.error?.name) }); if (errors.length > 10) errors.shift(); });
window.addEventListener("unhandledrejection", e => { errors.push({ type:"promise", code:safeCode(e.reason?.code || e.reason?.name) }); if (errors.length > 10) errors.shift(); });
function snapshot() {
  const signedIn = document.getElementById("auth-button")?.textContent === "Sign out";
  const selector = document.getElementById("storage-provider");
  const status = document.getElementById("storage-status");
  const driveStatus = document.getElementById("drive-status");
  return {
    version: VERSION, build, generatedAt: new Date().toISOString(),
    project: "contextwise-4a846",
    auth: signedIn ? "signed-in" : "signed-out-or-loading",
    storage: { disabled: !!selector?.disabled, selected: selector?.value || "none",
      state: status?.textContent?.startsWith("Sign in") ? "awaiting-auth" : "ready-or-saved" },
    drive: { buttonDisabled: !!document.getElementById("drive-connect")?.disabled,
      state: driveStatus?.textContent?.startsWith("Connected") ? "connected" : driveStatus?.textContent?.startsWith("Drive connection failed") ? "error" : "not-connected" },
    browser: { online: navigator.onLine, language: navigator.language },
    storageDiagnostics: window.contextwiseStorageDiagnostics ? { ...window.contextwiseStorageDiagnostics } : { moduleLoaded: false, suspectedIssue: "storage module failed before initialization" },
    authDiagnostics: window.contextwiseAuthDiagnostics ? { ...window.contextwiseAuthDiagnostics } : { moduleLoaded: false },
    driveDiagnostics: window.contextwiseDriveDiagnostics ? { ...window.contextwiseDriveDiagnostics } : { moduleLoaded: false },
    bootDiagnostics: window.contextwiseBoot ? { ...window.contextwiseBoot, moduleErrors: [...window.contextwiseBoot.moduleErrors] } : { initialized: false },
    errors: [...errors]
  };
}
function update() { output.textContent = JSON.stringify(snapshot(), null, 2); }
refresh.addEventListener("click", update);
copy.addEventListener("click", async () => {
  update();
  try { await navigator.clipboard.writeText(output.textContent); copy.textContent = "Copied"; }
  catch { copy.textContent = "Select text below to copy"; }
});
window.addEventListener("contextwise:auth", update);
window.addEventListener("contextwise:storage-diagnostics", update);
window.addEventListener("contextwise:drive-diagnostics", update);
setTimeout(update, 1200);
update();
