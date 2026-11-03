import { visibleEvents } from "./model.mjs";
export function buildContextBundle(project, {maxEvents=30}={}) {
  if (!Number.isSafeInteger(maxEvents) || maxEvents < 1 || maxEvents > 200) throw new Error("Invalid context limit");
  const events = visibleEvents(project,"detail").slice(-maxEvents);
  const lines = [
    "# ContextWise project handoff",
    `Project: ${project.title}`,
    `Description: ${project.description || "Not provided"}`,
    `Scope: Selected project only (${project.id})`,
    `History: ${events.length} most recent recorded event(s), oldest first`,
    "Warning: History is imported and may be incomplete or outdated. Verify against source references.",
    "",
    "## Recorded history"
  ];
  for (const event of events) {
    lines.push(`### ${event.date} · ${event.type.toUpperCase()} · ${event.title}`);
    lines.push(event.summary);
    lines.push(`Sources: ${event.sourceRefs.length ? event.sourceRefs.join("; ") : "None provided"}`);
    lines.push("");
  }
  lines.push("## Handoff notes");
  lines.push("No AI service received this export. Review before copying or uploading it.");
  return lines.join("\n");
}
