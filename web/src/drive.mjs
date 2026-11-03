// Google Drive app-folder connection, using only drive.file permission.
// Tokens live in module memory and are never exposed in diagnostics.
import { GoogleAuthProvider, reauthenticateWithPopup } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { auth } from "./auth.mjs?v=0.1.8";
import { parseDriveApiError, driveApiGuidance } from "./drive-error.mjs?v=0.1.8";

const connect = document.getElementById("drive-connect");
const driveStatus = document.getElementById("drive-status");
const apiHelp = document.getElementById("drive-api-help");
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
let token = null;
let folderId = null;

const diagnostics = {
  moduleLoaded: true,
  authEvents: 0,
  lastOperation: "idle",
  lastHttpStatus: null,
  lastApiReason: null,
  lastApiStatus: null,
  lastErrorCode: null
};
window.contextwiseDriveDiagnostics = diagnostics;

window.addEventListener("contextwise:auth", () => {
  diagnostics.authEvents += 1;
  diagnostics.lastOperation = "idle";
  token = null;
  folderId = null;
  connect.disabled = !auth.currentUser;
  apiHelp.hidden = true;
  driveStatus.textContent = "Drive not connected.";
});
connect.disabled = !auth.currentUser;

async function driveRequest(url, operation, options = {}) {
  diagnostics.lastOperation = operation;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {})
    }
  });
  if (!response.ok) {
    let body = null;
    try { body = await response.json(); } catch {}
    const info = parseDriveApiError(response.status, body);
    const error = new Error(driveApiGuidance(info));
    Object.assign(error, info);
    throw error;
  }
  return response.json();
}

connect.addEventListener("click", async () => {
  connect.disabled = true;
  apiHelp.hidden = true;
  diagnostics.lastOperation = "request-permission";
  diagnostics.lastHttpStatus = null;
  diagnostics.lastApiReason = null;
  diagnostics.lastApiStatus = null;
  diagnostics.lastErrorCode = null;
  try {
    if (!auth.currentUser) throw new Error("Sign in first");
    const provider = new GoogleAuthProvider();
    provider.addScope(DRIVE_SCOPE);
    provider.setCustomParameters({ prompt: "consent" });
    const result = await reauthenticateWithPopup(auth.currentUser, provider);
    token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
    if (!token) throw new Error("Drive permission token unavailable");

    const query = encodeURIComponent("name = 'ContextWise' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const existing = await driveRequest(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name),nextPageToken&pageSize=100`,
      "find-folder"
    );
    folderId = existing.files?.[0]?.id || null;
    if (!folderId) {
      const created = await driveRequest("https://www.googleapis.com/drive/v3/files?fields=id,name", "create-folder", {
        method: "POST", body: JSON.stringify({ name: "ContextWise", mimeType: "application/vnd.google-apps.folder" })
      });
      folderId = created.id || null;
      if (!folderId) throw new Error("Drive returned no folder ID");
    }
    diagnostics.lastOperation = "connected";
    driveStatus.textContent = "Connected to Google Drive. ContextWise folder ready. No archives uploaded.";
  } catch (error) {
    token = null;
    folderId = null;
    diagnostics.lastHttpStatus = Number.isInteger(error?.httpStatus) ? error.httpStatus : null;
    diagnostics.lastApiReason = error?.reason || null;
    diagnostics.lastApiStatus = error?.apiStatus || null;
    const code = String(error?.code || error?.name || "unknown");
    diagnostics.lastErrorCode = /^[A-Za-z0-9/_-]{1,80}$/.test(code) ? code : "unknown";
    const publicMessage = diagnostics.lastHttpStatus
      ? driveApiGuidance({ httpStatus: diagnostics.lastHttpStatus, reason: diagnostics.lastApiReason })
      : diagnostics.lastErrorCode.startsWith("auth/")
        ? `Google authorization failed (${diagnostics.lastErrorCode}).`
        : "Unable to complete the Google Drive connection.";
    driveStatus.textContent = `Drive connection failed: ${publicMessage}`;
    apiHelp.hidden = diagnostics.lastHttpStatus !== 403;
  } finally {
    connect.disabled = !auth.currentUser;
    window.dispatchEvent(new Event("contextwise:drive-diagnostics"));
  }
});
