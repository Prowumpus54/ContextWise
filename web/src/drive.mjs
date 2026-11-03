// Least-privilege Google Drive connection: only files created/opened by this app.
// Access tokens remain in memory, never localStorage or Firebase.
import { GoogleAuthProvider, reauthenticateWithPopup } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { auth } from "./auth.mjs?v=0.1.7";
const connect = document.getElementById("drive-connect");
const driveStatus = document.getElementById("drive-status");
// Reuse the initialized Firebase Auth instance from auth.mjs.
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
let token = null;
let folderId = null;
window.contextwiseDriveDiagnostics = { moduleLoaded: true, authEvents: 0 };
window.addEventListener("contextwise:auth", () => {
  window.contextwiseDriveDiagnostics.authEvents += 1;
  token = null; folderId = null; connect.disabled = !auth.currentUser;
  driveStatus.textContent = "Drive not connected.";
});
connect.disabled = !auth.currentUser;
async function driveRequest(url, options = {}) {
  const response = await fetch(url, { ...options, headers: {
    Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {})
  }});
  if (!response.ok) throw new Error(`Drive API HTTP ${response.status}`);
  return response.json();
}
connect.addEventListener("click", async () => {
  connect.disabled = true;
  try {
    if (!auth.currentUser) throw new Error("Sign in first");
    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_SCOPE);
    provider.setCustomParameters({ prompt: "consent" });
    const result = await reauthenticateWithPopup(auth.currentUser, provider);
    token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
    if (!token) throw new Error("Drive permission token unavailable");
    const query = encodeURIComponent("name = 'ContextWise' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const existing = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name),nextPageToken&page_size=100`);
    folderId = existing.files?.[0]?.id || null;
    if (!folderId) {
      const created = await driveRequest("https://www.googleapis.com/drive/v3/files?fields=id,name", {
        method: "POST", body: JSON.stringify({ name: "ContextWise", mimeType: "application/vnd.google-apps.folder" })
      });
      folderId = created.id;
    }
    driveStatus.textContent = "Connected to Google Drive. ContextWise folder ready. No archives uploaded.";
  } catch (e) {
    token = null; folderId = null;
    driveStatus.textContent = `Drive connection failed: ${e?.code || e?.message || "unknown"}`;
  } finally { connect.disabled = !auth.currentUser; }
});
