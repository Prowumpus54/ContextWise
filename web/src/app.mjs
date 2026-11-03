import { demoWorkspace } from "./demo.mjs";
import { normalizeWorkspace, MAX_IMPORT_BYTES } from "./validate.mjs";
import { visibleEvents } from "./model.mjs";
import { buildContextBundle } from "./context.mjs";

const $ = id => document.getElementById(id);
const state = { workspace:normalizeWorkspace(demoWorkspace), projectId:"aurora", zoom:"overview", query:"", eventId:null };
const project = () => state.workspace.projects.find(item => item.id === state.projectId);
const make = (tag, name, value) => {
  const el = document.createElement(tag);
  if (name) el.className = name;
  if (value !== undefined) el.textContent = value;
  return el;
};
function setStatus(message, error=false) {
  $("status").textContent = message;
  $("status").classList.toggle("error",error);
}
function showDetail(event) {
  const target = $("event-detail");
  target.replaceChildren();
  if (!event) {
    target.textContent="Select an event to inspect its summary and source references.";
    return;
  }
  target.append(make("p","eyebrow",`${event.date} · ${event.type.toUpperCase()}`));
  target.append(make("h3","detail-title",event.title));
  target.append(make("p","",event.summary));
  target.append(make("p","label","SOURCE REFERENCES"));
  if (!event.sourceRefs.length) target.append(make("p","muted","None supplied; treat this event as unverified."));
  for (const ref of event.sourceRefs) target.append(make("div","source",ref));
}
function render() {
  const selected = project();
  const select = $("project-select");
  select.replaceChildren(...state.workspace.projects.map(item => {
    const option = make("option","",item.title);
    option.value=item.id;
    return option;
  }));
  select.value=selected.id;
  $("project-description").textContent=selected.description;
  document.querySelectorAll("[data-zoom]").forEach(button => button.setAttribute("aria-pressed",String(button.dataset.zoom===state.zoom)));
  const events=visibleEvents(selected,state.zoom,state.query);
  $("event-count").textContent=`${events.length} event${events.length===1?"":"s"}`;
  const target=$("timeline");
  target.replaceChildren();
  if (!events.length) target.append(make("p","empty","No events match this zoom level and search."));
  for (const event of events) {
    const button=make("button","event"+(event.id===state.eventId?" selected":""));
    button.type="button";
    button.append(make("span","meta",`${event.date} · ${event.type}`));
    button.append(make("span","event-title",event.title));
    button.append(make("span","summary",event.summary));
    button.addEventListener("click",()=>{state.eventId=event.id;render();});
    target.append(button);
  }
  const active=events.find(item=>item.id===state.eventId)??null;
  showDetail(active);
}
$("project-select").addEventListener("change",event=>{state.projectId=event.target.value;state.eventId=null;render();});
$("search-input").addEventListener("input",event=>{state.query=event.target.value;state.eventId=null;render();});
document.querySelectorAll("[data-zoom]").forEach(button=>button.addEventListener("click",()=>{
  state.zoom=button.dataset.zoom;
  state.eventId=null;
  render();
}));
$("import-button").addEventListener("click",()=>$("import-file").click());
$("import-file").addEventListener("change",async event=>{
  const file=event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new Error("Import exceeds 2 MB limit");
    const workspace=normalizeWorkspace(JSON.parse(await file.text()));
    state.workspace=workspace;
    state.projectId=workspace.projects[0].id;
    state.eventId=null;
    state.zoom="overview";
    state.query="";
    $("search-input").value="";
    setStatus(`Loaded ${workspace.projects.length} project(s) into this browser tab only. Nothing was uploaded or saved.`);
    render();
  } catch (error) {
    setStatus(`Import rejected: ${error.message}`,true);
  } finally {
    event.target.value="";
  }
});
$("export-button").addEventListener("click",()=>{
  const selected=project();
  const contents=buildContextBundle(selected);
  const url=URL.createObjectURL(new Blob([contents],{type:"text/plain;charset=utf-8"}));
  const link=document.createElement("a");
  link.href=url;
  link.download=`contextwise-${selected.id}-handoff.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1200);
  setStatus("Context exported to a local text file. Review it before sharing with any AI provider.");
});
render();
