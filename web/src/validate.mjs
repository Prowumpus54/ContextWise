export const MAX_IMPORT_BYTES = 2_000_000;
const types = new Set(["milestone","decision","blocker","note"]);
const safeId = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
function text(value, label, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`Invalid ${label}`);
  return value.trim();
}
function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid event date");
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0,10) !== value) throw new Error("Invalid event date");
  return value;
}
export function normalizeWorkspace(raw) {
  if (!raw || raw.schemaVersion !== 1 || !Array.isArray(raw.projects) || raw.projects.length < 1 || raw.projects.length > 100) {
    throw new Error("Expected ContextWise JSON schemaVersion 1 with 1–100 projects");
  }
  const projectIds = new Set();
  const projects = raw.projects.map(project => {
    const id = text(project?.id,"project id",64);
    if (!safeId.test(id) || projectIds.has(id)) throw new Error("Duplicate or invalid project ID");
    projectIds.add(id);
    const title = text(project.title,"project title",120);
    const description = typeof project.description === "string" ? project.description.slice(0,3000) : "";
    if (!Array.isArray(project.events) || project.events.length > 5000) throw new Error("Project events must be an array with at most 5000 entries");
    const eventIds = new Set();
    const events = project.events.map(event => {
      const eventId = text(event?.id,"event id",64);
      if (!safeId.test(eventId) || eventIds.has(eventId)) throw new Error("Duplicate or invalid event ID");
      eventIds.add(eventId);
      if (!types.has(event.type)) throw new Error("Unsupported event type");
      if (!Array.isArray(event.sourceRefs) || event.sourceRefs.length > 12 || event.sourceRefs.some(ref => typeof ref !== "string" || ref.length > 400)) {
        throw new Error("Invalid source references");
      }
      return {
        id:eventId, date:date(event.date), type:event.type,
        title:text(event.title,"event title",160),
        summary:text(event.summary,"event summary",4000),
        sourceRefs:[...event.sourceRefs]
      };
    });
    return {id,title,description,events};
  });
  return {schemaVersion:1,projects};
}
