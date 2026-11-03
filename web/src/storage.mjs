// Preferences only. No cloud provider OAuth, tokens, or archive contents are stored.
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
window.addEventListener("contextwise:auth", event => { uid = event.detail?.uid || null; render(); });
// Firebase Auth can resolve before this module has attached its listener.
uid = window.contextwiseCurrentUid || null;
render();
save.addEventListener("click", () => {
  if (!uid || !supported.includes(select.value)) return;
  try {
    localStorage.setItem(key(uid), select.value);
    status.textContent = `Saved on this browser: ${labels[select.value]}. No provider is connected or synced.`;
  } catch { status.textContent = "Could not save preference in this browser."; }
});
render();
