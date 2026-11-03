import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDriveApiError, driveApiGuidance } from "../web/src/drive-error.mjs";

test("Drive 403 SERVICE_DISABLED gives an actionable diagnosis", () => {
  const body = { error: { status: "PERMISSION_DENIED", message: "may include sensitive data",
    details: [{ reason: "SERVICE_DISABLED", domain: "googleapis.com" }] } };
  const parsed = parseDriveApiError(403, body);
  assert.deepEqual(parsed, { httpStatus: 403, reason: "SERVICE_DISABLED", apiStatus: "PERMISSION_DENIED" });
  assert.match(driveApiGuidance(parsed), /Enable it in Google Cloud/);
  assert.equal(JSON.stringify(parsed).includes("sensitive"), false);
});
test("Drive legacy disabled API reason recognized", () => {
  const parsed = parseDriveApiError(403, { error: { errors: [{ reason: "accessNotConfigured", message: "private" }] } });
  assert.equal(parsed.reason, "accessNotConfigured");
  assert.match(driveApiGuidance(parsed), /disabled/);
});
test("Drive arbitrary 403 remains generic rather than claiming disabled", () => {
  const parsed = parseDriveApiError(403, { error: { errors: [{ reason: "insufficientPermissions" }] } });
  assert.equal(parsed.reason, "insufficientPermissions");
  assert.match(driveApiGuidance(parsed), /permissions/);
  assert.doesNotMatch(driveApiGuidance(parsed), /is disabled/);
});
test("Drive error parser sanitizes unknown and malformed reason fields", () => {
  assert.equal(parseDriveApiError(403, { error: { status: "abc secret@example.com" } }).reason, "unknown");
  assert.deepEqual(parseDriveApiError(500, null), { httpStatus: 500, reason: "unknown", apiStatus: "unknown" });
});
