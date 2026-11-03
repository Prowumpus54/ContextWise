# ContextWise UI behavior — v0.1.9

Human-first dark workspace with project dropdown, storage controls, milestone/decision/detail filters, search, timeline, event inspector and a Connected Ideas relationship visualization.

- **Milestones** shows milestone outcomes; **Decisions** shows milestones/decisions/blockers; **Everything** includes notes. These are discrete category filters, not continuous time pan/zoom.
- Search applies inside the selected project/zoom level. Selecting an event shows its summary, source identifiers and connected ideas when present. Project selection resets the selected event so no old project detail remains visible.
- Connected Ideas graph shows related projects or a focused event's linked nodes, with selectable SVG nodes, a relationship list and navigation to the linked project's event.
- Initially shows synthetic demo content. The **Load archived projects** button is disabled until sign-in; the explicit action requests a Google Drive read-only scope and attempts to load the newest combined private workspace JSON into tab memory, replacing the demo workspace.
- Manual import accepts validated local JSON and stays in this tab; export downloads plaintext scoped to the selected project.
- Display evidence uncertainty honestly: current v1 relation lines are links documented in the archive and **do not prove causality**. Confidence/revision review is planned.
- Accessibility target: keyboard-operable buttons/graph, visible focus, readable contrast, screen-reader status announcements, responsive mobile layout. Full manual accessibility and mobile testing remains open.
- Never present the demo, storage preference or signed-in state as a private encrypted vault.
