// Startup and per-browser access diagnostics. No network reporting, account identifiers, tokens or archive data.
// This recorder is intentionally loaded synchronously before ES modules.
window.contextwiseBoot = { initialized: true, moduleErrors: [], runtimeErrors: 0, promiseRejections: 0 };
window.contextwiseAccessDiagnostics = {
  initialized: true,
  capture: "this-browser-tab-only",
  pageOpenedAt: new Date().toISOString(),
  authAttempts: 0, authSuccesses: 0, authFailures: 0, authCanceled: 0,
  driveAttempts: 0, driveFailures: 0, archiveAttempts: 0, archiveFailures: 0,
  resourceFailures: 0, lastOutcome: "page-loaded", events: []
};
const allowedCategories = new Set(["page", "auth", "drive", "archive", "resource", "runtime"]);
const allowedOutcomes = new Set([
  "opened", "attempt", "success", "failed", "canceled", "signed-out",
  "session-restored", "session-ended"
]);
window.contextwiseRecordAccess = (category, outcome, inputCode = "") => {
  if (!allowedCategories.has(category) || !allowedOutcomes.has(outcome)) return;
  const state = window.contextwiseAccessDiagnostics;
  // Store only a short machine-readable code, never exception messages, URLs or user-provided text.
  const code = typeof inputCode === "string" && /^[a-z0-9/_-]{1,80}$/i.test(inputCode) ? inputCode : "";
  const event = { at: new Date().toISOString(), category, outcome };
  if (code) event.code = code;
  state.events.push(event);
  if (state.events.length > 16) state.events.shift();
  state.lastOutcome = `${category}:${outcome}`;
  if (category === "auth") {
    if (outcome === "attempt") state.authAttempts++;
    if (outcome === "success") state.authSuccesses++;
    if (outcome === "failed") state.authFailures++;
    if (outcome === "canceled") state.authCanceled++;
  }
  if (category === "drive") {
    if (outcome === "attempt") state.driveAttempts++;
    if (outcome === "failed") state.driveFailures++;
  }
  if (category === "archive") {
    if (outcome === "attempt") state.archiveAttempts++;
    if (outcome === "failed") state.archiveFailures++;
  }
  if (category === "resource" && outcome === "failed") state.resourceFailures++;
  window.dispatchEvent(new Event("contextwise:access-diagnostics"));
};
window.contextwiseRecordAccess("page", "opened");
window.addEventListener("error", event => {
  const state = window.contextwiseBoot;
  if (event.target && ["SCRIPT", "LINK", "IMG"].includes(event.target.tagName)) {
    if (event.target.tagName === "SCRIPT")
      state.moduleErrors.push({ module: event.target.dataset.module || "unknown", reason: "script-load-error" });
    window.contextwiseRecordAccess("resource", "failed", event.target.tagName.toLowerCase());
  } else {
    state.runtimeErrors++;
    window.contextwiseRecordAccess("runtime", "failed");
    const message = String(event.message || "");
    if (message.includes("does not provide an export")) state.moduleErrors.push({ reason: "missing-module-export" });
    else if (message.includes("Failed to fetch")) state.moduleErrors.push({ reason: "module-fetch-failed" });
  }
  state.moduleErrors = state.moduleErrors.slice(-10);
}, true);
window.addEventListener("unhandledrejection", () => {
  window.contextwiseBoot.promiseRejections++;
  window.contextwiseRecordAccess("runtime", "failed", "promise-rejection");
});
