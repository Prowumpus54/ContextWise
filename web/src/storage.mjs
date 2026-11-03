// Preferences only. No cloud provider OAuth, tokens, or archive contents are stored.
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { auth } from "./auth.mjs?v=0.1.7";
const supported = ["google-drive", "onedrive", "dropbox", "desktop"];
const labels = {"google-drive":"Google Drive","onedrive":"OneDrive","dropbox":"Dropbox","desktop":"This computer"};
const select = document.getElementById("storage-provider");
const save = document.getElementById("storage-save");
const status = document.getElementById("storage-status");
let uid = null;
const key = id => `contextwise:storage-preference:${id}`;
function render() {
  select.disabled = !uid;
  save.disabled = !uid;
  if (!uid) { select.value = ""; status.textContent = "Sign in to select a storage preference."; return; }
  let saved = null;
  try { saved = localStorage.getItem(key(uid)); } catch {}
  select.value = supported.includes(saved) ? saved : "";
  status.textContent = saved && supported.includes(saved)
    ? `Preference: ${labels[saved]}. Connection not yet available; no files are synced.`
    : "Choose a future archive location. No provider is connected yet.";
}
window.contextwiseStorageDiagnostics = { moduleLoaded: true, authSubscribed: false, callbackCount: 0, lastAuthState: "pending", lastErrorCode: null };
try {
  onAuthStateChanged(auth, user => {
    uid = user?.uid || null;
    Object.assign(window.contextwiseStorageDiagnostics, { authSubscribed: true, callbackCount: window.contextwiseStorageDiagnostics.callbackCount + 1, lastAuthState: uid ? "signed-in" : "signed-out" });
    render();
    window.dispatchEvent(new Event("contextwise:storage-diagnostics"));
  }, error => {
    uid = null;
    Object.assign(window.contextwiseStorageDiagnostics, { lastAuthState: "error", lastErrorCode: String(error?.code || "unknown").slice(0,80) });
    render();
    window.dispatchEvent(new Event("contextwise:storage-diagnostics"));
  });
} catch (error) {
  window.contextwiseStorageDiagnostics.lastErrorCode = String(error?.code || error?.name || "unknown").slice(0,80);
  window.dispatchEvent(new Event("contextwise:storage-diagnostics"));
}
save.addEventListener("click", () => {
  if (!uid || !supported.includes(select.value)) return;
  try {
    localStorage.setItem(key(uid), select.value);
    status.textContent = `Saved on this browser: ${labels[select.value]}. No provider is connected or synced.`;
  } catch { status.textContent = "Could not save preference in this browser."; }
});
render();
