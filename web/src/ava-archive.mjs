// Importer for private Ava incremental archives exported from Google Docs.
// Pure functions: no network, auth, persistence, or browser globals.
import { normalizeWorkspace } from "./validate.mjs";

const ARCHIVE_LINE_LIMIT = 5000;
const SOURCE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const allowedClassifications = new Set([
  "verified","reported","inferred","unknown","verified_bulletin",
  "verified_checklist_and_bulletin","verified_bulletin_and_drive",
  "reported_fixture_inspected"
]);
const projectId = "buildwise";
function eventDate(at) {
  if (typeof at !== "string" || !DATE_TIME.test(at) || !Number.isFinite(Date.parse(at))) {
    throw new Error("Invalid archive event timestamp");
  }
  return new Date(at).toISOString().slice(0,10);
}
export function parseAvaArchive(content) {
  if (typeof content !== "string" || content.length > 2_000_000) throw new Error("Archive document too large");
  if (!/^\uFEFF?CONTEXTWISE AVA (?:INCREMENTAL |APPEND-ONLY )?ARCHIVE/m.test(content)) {
    throw new Error("Not an Ava incremental archive");
  }
  const records = [];
  const seen = new Set();
  for (const line of content.split(/\r?\n/)) {
    if (!line.trimStart().startsWith("{")) continue;
    if (++records.length > ARCHIVE_LINE_LIMIT) throw new Error("Too many incremental events");
    let record;
    try { record = JSON.parse(line); } catch { throw new Error("Invalid archival JSON record"); }
    const id = record?.sourceMessageId;
    if (!SOURCE_ID.test(id || "") || seen.has(id.toLowerCase())) {
      throw new Error("Missing or duplicate bulletin source ID");
    }
    if (!allowedClassifications.has(record.classification) ||
        typeof record.summary !== "string" || !record.summary.trim() || record.summary.length > 4000) {
      throw new Error("Invalid archival evidence record");
    }
    const date = eventDate(record.at);
    seen.add(id.toLowerCase());
    records[records.length - 1] = {
      sourceMessageId: id.toLowerCase(), date, classification: record.classification,
      summary: record.summary.trim()
    };
  }
  if (!records.length) throw new Error("Archive has no bulletin events");
  return records;
}
export function mergeAvaRecords(base, archives) {
  if (!Array.isArray(archives) || archives.length > 100) throw new Error("Too many archive documents");
  const workspace = base ? normalizeWorkspace(base) : {
    schemaVersion:1, projects:[], relations:[]
  };
  // Clone to prevent mutations leaking into an already displayed workspace.
  const projects = workspace.projects.map(p => ({...p, events:p.events.map(e => ({...e, sourceRefs:[...e.sourceRefs]}))}));
  const relations = [...workspace.relations];
  let project = projects.find(p => p.id === projectId);
  if (!project) {
    project = {id:projectId,title:"BuildWise",description:"Evidence-linked BuildWise bulletin archive",events:[]};
    projects.push(project);
  }
  const sourceIds = new Set();
  for (const event of project.events) {
    for (const ref of event.sourceRefs) {
      const match = String(ref).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (match) sourceIds.add(match[0].toLowerCase());
    }
  }
  let added = 0;
  for (const archive of archives) {
    for (const record of parseAvaArchive(archive)) {
      if (sourceIds.has(record.sourceMessageId)) continue;
      if (project.events.length >= 5000) throw new Error("BuildWise event limit exceeded");
      const id = "bw-" + record.sourceMessageId;
      if (project.events.some(e => e.id === id)) {sourceIds.add(record.sourceMessageId);continue;}
      project.events.push({
        id,date:record.date,type:"note",
        title:"BuildWise bulletin · " + record.classification.replaceAll("_"," "),
        summary:record.summary,
        sourceRefs:["BuildWise bulletin message ID: " + record.sourceMessageId,
                    "Evidence classification: " + record.classification]
      });
      sourceIds.add(record.sourceMessageId);
      added++;
    }
  }
  project.events.sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return { workspace: normalizeWorkspace({schemaVersion:1,projects,relations}), added };
}
