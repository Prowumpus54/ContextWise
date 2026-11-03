// Firebase Auth is for identity only. Never upload imported archive content.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const config = {
  apiKey: "AIzaSyCZ3LAr3HRGLVmfMtwpNh1XJwv5tKcgfBw",
  authDomain: "contextwise-4a846.firebaseapp.com",
  projectId: "contextwise-4a846",
  appId: "1:605877300235:web:98ae8cdb0f8491844e6b0e",
};
export const auth = getAuth(initializeApp(config));
window.contextwiseAuthDiagnostics = { moduleLoaded: true, callbackCount: 0, lastAuthState: "pending", lastErrorCode: null };
const button = document.getElementById("auth-button");
const label = document.getElementById("auth-status");
let currentUser = null;

onAuthStateChanged(auth, user => {
  window.contextwiseAuthDiagnostics.callbackCount += 1;
  window.contextwiseAuthDiagnostics.lastAuthState = user ? "signed-in" : "signed-out";
  currentUser = user;
  window.contextwiseRecordAccess?.("auth", user ? "session-restored" : "session-ended");
  button.textContent = user ? "Sign out" : "Sign in with Google";
  label.textContent = user ? `Signed in as ${user.email || "Google user"}` : "Not signed in";
  window.contextwiseCurrentUid = user?.uid || null;
  window.dispatchEvent(new CustomEvent("contextwise:auth", { detail: { uid: user?.uid || null } }));
  // Identity is intentionally not used to persist or upload timeline data.
}, error => {
  window.contextwiseAuthDiagnostics.lastAuthState = "error";
  window.contextwiseAuthDiagnostics.lastErrorCode = String(error?.code || "unknown").slice(0, 80);
  window.contextwiseRecordAccess?.("auth", "failed", String(error?.code || "unknown"));
  label.textContent = "Authentication unavailable";
});

button.addEventListener("click", async () => {
  button.disabled = true;
  window.contextwiseRecordAccess?.("auth", "attempt");
  try {
    if (currentUser) {
      await signOut(auth);
      window.contextwiseRecordAccess?.("auth", "signed-out");
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      window.contextwiseRecordAccess?.("auth", "success");
    }
  } catch (error) {
    const code = error?.code || "unknown";
    window.contextwiseRecordAccess?.("auth", code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request" ? "canceled" : "failed", String(code));
    label.textContent = code === "auth/operation-not-allowed"
      ? "Enable Google in Firebase Authentication > Sign-in method."
      : code === "auth/popup-closed-by-user"
        ? "Sign-in canceled."
        : `Sign-in failed: ${code}`;
  } finally {
    button.disabled = false;
  }
});
