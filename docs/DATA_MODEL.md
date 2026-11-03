# Data model — P0 JSON import

Accepted file shape:
```json
{
  "schemaVersion": 1,
  "projects": [{
    "id": "my-project",
    "title": "My Project",
    "description": "Optional description",
    "events": [{
      "id": "event-001",
      "date": "2026-11-02",
      "type": "milestone",
      "title": "Prototype started",
      "summary": "Human-readable description",
      "sourceRefs": ["relative-or-external-source-identifier"]
    }]
  }]
}
```

Rules: 1–100 projects, up to 5000 events per project, import file max 2 MB. Types: milestone, decision, blocker, note. Dates are strict YYYY-MM-DD. IDs are stable and unique within a project; project IDs unique within import. Source references are displayed as inert text; they are not fetched.

**Current behavior:** memory only; changing/reloading tab loses imported data. Export produces a plaintext `.txt`, not an encrypted archive.

## Future model directions
Context records with provenance, version/validity status, supersession links, project membership, temporal ranges, redaction labels, and sharing grants. Encryption/search-index mechanics remain design decisions.
