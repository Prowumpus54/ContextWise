# Data model — deployed import contract (v0.1.9)

The live import contract remains `schemaVersion: 1`. A backward-compatible optional `relations` root array was added in v0.1.9; graph schema v2 is **not** implemented.

```json
{
  "schemaVersion": 1,
  "projects": [{
    "id": "buildwise",
    "title": "BuildWise",
    "description": "Project overview",
    "events": [{
      "id": "milestone-001",
      "date": "2026-10-28",
      "type": "milestone",
      "title": "Example milestone",
      "summary": "Source-grounded explanation.",
      "sourceRefs": ["https://github.com/example/repo/commit/example"]
    }, {
      "id": "another-event-id",
      "date": "2026-10-29",
      "type": "decision",
      "title": "Example decision",
      "summary": "A second event that can receive a relationship.",
      "sourceRefs": ["example:decision"]
    }]
  }],
  "relations": [{
    "id": "link-001",
    "fromRef": {"projectId": "buildwise", "eventId": "milestone-001"},
    "toRef": {"projectId": "buildwise", "eventId": "another-event-id"},
    "kind": "informs",
    "label": "Relationship explanation",
    "sourceRefs": ["source identifier"]
  }]
}
```

The example above illustrates the data shape; the sample links two existing events in the same project. Real relations can also connect two different projects, but may not point from an event to itself.

## Validation
- 1–100 projects, 0–5,000 events per project, 0–2,000 optional relations total; max import file size **2,000,000 bytes**.
- IDs: letters/digits followed by up to 63 letters/digits/underscores/hyphens; project IDs globally unique, event IDs unique within each project, relation IDs unique.
- Event dates: strict real ISO calendar dates `YYYY-MM-DD`.
- Event types: `milestone`, `decision`, `blocker`, `note`.
- Relation kinds: `depends_on`, `informs`, `implemented_by`, `coordinates`, `evolved_into`, `related_to`.
- Required event fields: id, date, type, title (<=160), summary (<=4,000), sourceRefs (0–12; <=400 characters each). Project titles <=120; description <=3,000; relation labels <=300 and sourceRefs follow the same limit.
- Both ends of a relationship MUST resolve to actual imported project/event identities. Self-links, duplicate IDs, invalid types and dangling references fail validation. Existing v1 files without `relations` remain valid.
- All input text is untrusted and displayed as inert text, not HTML. Unknown extra fields are not part of the normalized workspace.
- Current relation records do **not** store evidence confidence, author inference status or supersession; links are not proof of causation.

## Persistence
Local JSON imports and plugin-written Drive archives are separate paths; a browser session only holds currently loaded data in memory. No encrypted vault, automatic sync or cross-account archive-store contract exists.
