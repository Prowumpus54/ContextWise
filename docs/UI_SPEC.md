# UI behavior

Design: human-first dark workspace with project sidebar, horizontal project controls, zoom selector, timeline rail, and detail inspector.

Levels:
- Milestones: important outcomes only.
- Decisions: milestones + decisions + blockers.
- Everything: all event types including notes.

Searching filters within the selected zoom, rather than bypassing hidden categories.
Selecting an event reveals summary and inert source references.
Switching projects resets selection to prevent cross-project inspector leakage.
Export always includes **only the currently selected project**, and is manually initiated.

Accessibility minimum: keyboard-operable buttons/selects, focus visibility, readable text contrast, status announcements, responsive layout. Advanced pinch/scroll-to-zoom and branching timeline are subsequent P0 design work, not implemented.
