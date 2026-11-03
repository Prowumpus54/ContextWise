import { demoWorkspace } from "./demo.mjs";
import { normalizeWorkspace, MAX_IMPORT_BYTES } from "./validate.mjs";
import { visibleEvents } from "./model.mjs";
import { buildContextBundle } from "./context.mjs";
import { ideaMap, linksForEvent } from "./graph.mjs";

const $ = id => document.getElementById(id);
const state = {
  workspace: normalizeWorkspace(demoWorkspace),
  projectId: "aurora", zoom: "overview", query: "", eventId: null, source: "sample"
};
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
  target.append(make("p","eyebrow",`${event.date} - ${event.type.toUpperCase()}`));
  target.append(make("h3","detail-title",event.title));
  target.append(make("p","",event.summary));
  target.append(make("p","label","SOURCE REFERENCES"));
  if (!event.sourceRefs.length) target.append(make("p","muted","None supplied; treat this event as unverified."));
  for (const ref of event.sourceRefs) target.append(make("div","source",ref));
  const linked = linksForEvent(state.workspace,{projectId:state.projectId,eventId:event.id});
  if (linked.length) target.append(make("p","label",`LINKED IDEAS (${linked.length})`));
  for (const {relation,neighbor} of linked) {
    const button = make("button","related-item",`${neighbor.project.title}: ${neighbor.event.title} - ${relation.label}`);
    button.type = "button";
    button.addEventListener("click",()=>navigateTo(neighbor.project.id,neighbor.event.id));
    target.append(button);
  }
}
function navigateTo(projectId, eventId=null) {
  state.projectId = projectId;
  state.eventId = eventId;
  state.query = "";
  $("search-input").value = "";
  if (eventId) state.zoom = "detail";
  render();
}
const NS="http://www.w3.org/2000/svg";
function svgEl(tag,attrs={},content) {
  const element=document.createElementNS(NS,tag);
  for (const [key,value] of Object.entries(attrs)) element.setAttribute(key,String(value));
  if (content !== undefined) element.textContent=content;
  return element;
}
function graphNode(svg, node, x, y, isCenter=false) {
  const group=svgEl("g",{
    class:isCenter?"idea-node idea-node-center":"idea-node idea-node-peer",
    transform:`translate(${x},${y})`,
    role:isCenter?"img":"button",
    "aria-label": `${node.projectTitle||node.title}: ${node.title}`,
    ...(isCenter?{}:{tabindex:"0"})
  });
  const width=isCenter?246:218;
  group.append(svgEl("rect",{x:-width/2,y:-34,width,height:68,rx:14}));
  group.append(svgEl("text",{x:0,y:-7,"text-anchor":"middle",class:"idea-node-title"},node.title.length>27?node.title.slice(0,25)+"...":node.title));
  if (node.projectTitle && node.projectTitle!==node.title) group.append(svgEl("text",{x:0,y:14,"text-anchor":"middle",class:"idea-node-subtitle"},node.projectTitle.slice(0,32)));
  if (!isCenter) {
    group.append(svgEl("title",{},`${node.title} - ${node.label||""}. Open this idea.`));
    const open=()=>navigateTo(node.projectId,node.eventId||null);
    group.addEventListener("click",open);
    group.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
  }
  svg.append(group);
}
function renderIdeaMap() {
  const graph=ideaMap(state.workspace,state.projectId,state.eventId);
  const svg=$("idea-map");
  const links=$("idea-links");
  svg.replaceChildren(); links.replaceChildren();
  $("connections-count").textContent=`${graph.nodes.length} linked ${graph.mode==="event"?"idea":"project"}${graph.nodes.length===1?"":"s"}`;
  $("connections-intro").textContent= graph.mode==="event"
    ? "This idea's documented relationships. Select a neighboring idea to follow its history."
    : "Cross-project connections. Select a project, then an event, to explore its branches.";
  const cx=460,cy=205;
  const visible=graph.nodes.slice(0,8);
  if (!visible.length) {
    svg.replaceChildren(svgEl("text",{x:cx,y:cy,"text-anchor":"middle",class:"idea-node-subtitle"},
      "No linked ideas in this archive. Select another event or import a linked workspace."));
  } else {
    visible.forEach((node,i)=>{
      const a=-Math.PI/2+(2*Math.PI*i/visible.length);
      const x=cx+Math.cos(a)*(visible.length===1?290:310);
      const y=cy+Math.sin(a)*(visible.length===1?0:138);
      svg.append(svgEl("path",{d:`M ${cx} ${cy} L ${x} ${y}`,class:"idea-edge"}));
    });
    visible.forEach((node,i)=>{
      const a=-Math.PI/2+(2*Math.PI*i/visible.length);
      const x=cx+Math.cos(a)*(visible.length===1?290:310);
      const y=cy+Math.sin(a)*(visible.length===1?0:138);
      graphNode(svg,node,x,y);
    });
    graphNode(svg,graph.center,cx,cy,true);
  }
  const selectedProject=project();
  const referenced=(state.workspace.relations||[]).filter(r=>r.fromRef.projectId===selectedProject.id||r.toRef.projectId===selectedProject.id);
  for (const rel of referenced.slice(0,14)) {
    const from=state.workspace.projects.find(p=>p.id===rel.fromRef.projectId);
    const to=state.workspace.projects.find(p=>p.id===rel.toRef.projectId);
    const fromEvent=from?.events.find(e=>e.id===rel.fromRef.eventId);
    const toEvent=to?.events.find(e=>e.id===rel.toRef.eventId);
    if (!from||!to||!fromEvent||!toEvent) continue;
    const button=make("button","connection-card");
    button.type="button";
    const title=make("strong","",`${fromEvent.title}  ↔  ${toEvent.title}`);
    button.append(title);
    button.append(make("span","connection-projects",`${from.title} / ${to.title} - ${rel.kind.replaceAll("_"," ")}`));
    button.append(make("span","connection-explanation",rel.label));
    button.title=rel.sourceRefs.join("; ") || "No cited sources";
    button.addEventListener("click",()=> {
      const other=rel.fromRef.projectId===state.projectId?rel.toRef:rel.fromRef;
      navigateTo(other.projectId,other.eventId);
    });
    links.append(button);
  }
  if (referenced.length>14) links.append(make("p","muted",`Showing 14 of ${referenced.length} links. Select an event to narrow the map.`));
}
function render() {
  const selected=project();
  if (!selected) return;
  const select=$("project-select");
  select.replaceChildren(...state.workspace.projects.map(item => {
    const option=make("option","",item.title);
    option.value=item.id;
    return option;
  }));
  select.value=selected.id;
  $("project-description").textContent=selected.description;
  $("stat-projects").textContent=String(state.workspace.projects.length);
  $("stat-events").textContent=String(selected.events.length);
  const last=selected.events.map(e=>e.date).sort().at(-1);
  $("stat-latest").textContent=last?new Date(last+"T12:00:00").toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}):"None";
  $("data-origin").textContent= state.source==="drive"?"Private Drive archive"
    :state.source==="local"?"Imported browser data":"Synthetic examples";
  document.querySelectorAll("[data-zoom]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.zoom===state.zoom)));
  const events=visibleEvents(selected,state.zoom,state.query);
  $("event-count").textContent=`${events.length} event${events.length===1?"":"s"}`;
  const target=$("timeline");
  target.replaceChildren();
  if (!events.length) target.append(make("p","empty","No events match this zoom level and search."));
  for (const event of events) {
    const button=make("button","event"+(event.id===state.eventId?" selected":""));
    button.type="button";
    button.append(make("span","meta",`${event.date} - ${event.type}`));
    button.append(make("span","event-title",event.title));
    button.append(make("span","summary",event.summary));
    button.addEventListener("click",()=>{state.eventId=event.id;render();});
    target.append(button);
  }
  const active=selected.events.find(item=>item.id===state.eventId)||null;
  showDetail(active);
  renderIdeaMap();
}
function importWorkspace(raw,source) {
  const workspace=normalizeWorkspace(raw);
  state.workspace=workspace;
  state.projectId=workspace.projects.some(p=>p.id==="buildwise")?"buildwise":workspace.projects[0].id;
  state.eventId=null;
  state.zoom="overview";
  state.query="";
  state.source=source;
  $("search-input").value="";
  const nEvents=workspace.projects.reduce((sum,p)=>sum+p.events.length,0);
  setStatus(`Loaded ${workspace.projects.length} projects, ${nEvents} events and ${workspace.relations.length} linked ideas from ${source==="drive"?"your private Google Drive archive":"a local JSON file"}. Data stays in this browser tab.`);
  render();
}
$("project-select").addEventListener("change",event=>navigateTo(event.target.value));
$("search-input").addEventListener("input",event=>{state.query=event.target.value;state.eventId=null;render();});
document.querySelectorAll("[data-zoom]").forEach(button=>button.addEventListener("click",()=>{
  state.zoom=button.dataset.zoom;
  state.eventId=null;
  render();
}));
$("import-button").addEventListener("click",()=>$("import-file").click());
$("import-file").addEventListener("change",async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  try {
    if(file.size>MAX_IMPORT_BYTES)throw new Error("Import exceeds 2 MB limit");
    importWorkspace(JSON.parse(await file.text()),"local");
  } catch(error) {setStatus(`Import rejected: ${error.message}`,true);}
  finally {event.target.value="";}
});
window.addEventListener("contextwise:workspace-loaded",event=>{
  try {importWorkspace(event.detail.workspace,"drive");}
  catch {setStatus("Google Drive archive rejected by schema validation.",true);}
});
$("export-button").addEventListener("click",()=>{
  const contents=buildContextBundle(project());
  const url=URL.createObjectURL(new Blob([contents],{type:"text/plain;charset=utf-8"}));
  const link=document.createElement("a");
  link.href=url;
  link.download=`contextwise-${project().id}-handoff.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  setStatus("Context exported to a local text file. Review it before sharing with any AI provider.");
});
render();
