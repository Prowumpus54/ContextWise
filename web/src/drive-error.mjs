// Limit API diagnostics to codes only. Never expose response messages, tokens, or account data.
const safeCode = value => {
  const stringValue = String(value ?? "");
  return /^[A-Za-z0-9_.-]{1,80}$/.test(stringValue) ? stringValue : "unknown";
};

export function parseDriveApiError(httpStatus, body) {
  const response = body && typeof body === "object" ? body.error : null;
  const details = Array.isArray(response?.details) ? response.details : [];
  const errors = Array.isArray(response?.errors) ? response.errors : [];
  const rawReason = details.find(value => value && typeof value.reason === "string")?.reason
    || errors.find(value => value && typeof value.reason === "string")?.reason
    || response?.status || "unknown";
  return {
    httpStatus: Number.isInteger(httpStatus) ? httpStatus : 0,
    reason: safeCode(rawReason),
    apiStatus: safeCode(response?.status ?? "unknown")
  };
}

export function driveApiGuidance({ httpStatus, reason }) {
  if (httpStatus === 403 && ["SERVICE_DISABLED", "accessNotConfigured", "API_DISABLED"].includes(reason)) {
    return "Google Drive API is disabled for this project. Enable it in Google Cloud, then retry.";
  }
  if (httpStatus === 403) return "Google denied this Drive API request. Check the project's Drive API and OAuth permissions.";
  if (httpStatus === 401) return "Drive access expired or was rejected. Reconnect Google Drive.";
  if (httpStatus === 429) return "Google Drive rate limit reached. Retry later.";
  return `Google Drive API request failed (HTTP ${httpStatus}).`;
}
