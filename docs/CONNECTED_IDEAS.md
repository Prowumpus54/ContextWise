# Connected ideas / BuildWise archive — v0.1.9

## Current implementation
The public Firebase-hosted shell uses demo data until the owner signs in and explicitly clicks **Load archived projects**. This button requests the Google Drive `drive.readonly` scope and looks only in the owner's `ContextWise` folder for the most recent `contextwise-workspace-*.json` snapshot. It reads and validates the archive **in the browser session**, without publishing JSON files to Firebase Hosting or uploading them to Firestore.

The Drive plugin produced and verified a 63,476-byte archive:
- Filename: `contextwise-workspace-20261103-buildwise-01.json`
- File ID and parent folder ID: verified through the authenticated Drive connector; intentionally omitted from public Git history going forward.
- Five projects: Tasker/FlowWise, BuildWise, VaultWise, Atlas, ContextWise
- 93 combined events, 14 cross-project relationships

The website project selector, timeline and Connected Ideas map use the archive after loading. The relationships are optional top-level schema v1 records, preserving compatibility with earlier unlinked archives.

## Schema extension
A relationship includes:
```json
{
  "id": "buildwise-to-tasker-01",
  "fromRef": {"projectId": "buildwise", "eventId": "bw-event"},
  "toRef": {"projectId": "tasker", "eventId": "tasker-event"},
  "kind": "coordinates",
  "label": "Why these events connect",
  "sourceRefs": ["Evidence"]
}
```
Allowed relationship kinds: `depends_on`, `informs`, `implemented_by`, `coordinates`, `evolved_into`, `related_to`. Maximum 2,000 relations. Both event references must exist in the imported workspace. Self-references and duplicate relationship IDs are rejected. Render text as text, never injected HTML.

## Boundaries and next work
- Read-only Google Drive scope grants the website access to more than the archive folder; this is stated explicitly before consent. Browser code searches only the selected ContextWise folder.
- The website's access token is memory-only and consent may be requested again on later sessions.
- No unattended backend, permanent token, automatic sync, or hosted private archive has been implemented.
- Each new snapshot must be validated and relation references remain consistent. Existing Tasker JSON remains a separate immutable archive; this combined snapshot does not overwrite it.
- User session with Google consent and archive read has **not yet been verified**. Local and live module smoke tests plus 20 automated tests pass.
