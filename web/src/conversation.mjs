// Source-grounded, provider-independent message and decision-reference contracts.
// This module does NOT authenticate senders or deliver messages to ChatGPT threads.
const safeId = /^[a-z0-9][a-z0-9_-]{0,79}$/i;
const kinds = new Set(["question", "proposal", "work-update", "evidence"]);
const clean = (value, max) => typeof value === "string" && value.length > 0 &&
  value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
const checkedId = id => typeof id === "string" && safeId.test(id);

export function resolveContextRef(workspace, ref) {
  if (!checkedId(ref?.projectId) || !checkedId(ref?.eventId)) return null;
  const project = workspace?.projects?.find(p => p.id === ref.projectId);
  const event = project?.events?.find(e => e.id === ref.eventId);
  return project && event ? { project, event, ref: { projectId: project.id, eventId: event.id } } : null;
}

export function contextChoices(workspace, projectId) {
  const project = workspace?.projects?.find(p => p.id === projectId);
  if (!project) return [];
  const result = [];
  const seen = new Set();
  function add(p, e) {
    const key = p.id + "/" + e.id;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({
      projectId:p.id,eventId:e.id,projectTitle:p.title,title:e.title,
      type:e.type,date:e.date,hasSources:e.sourceRefs.length > 0
    });
  }
  for (const event of project.events) if (event.type !== "note") add(project,event);
  // Adjacent ideas from the graph, including cross-project decisions.
  for (const rel of workspace.relations || []) {
    const refs = [rel.fromRef,rel.toRef];
    if (refs.some(r => r.projectId === projectId)) {
      for (const ref of refs) {
        const found = resolveContextRef(workspace,ref);
        if (found) add(found.project,found.event);
      }
    }
  }
  return result.sort((a,b)=>a.projectId===projectId && b.projectId!==projectId?-1:
    b.projectId===projectId && a.projectId!==projectId?1:
    b.date.localeCompare(a.date));
}

export function validateRoomMessage(input, workspace) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid message");
  if (input.schemaVersion !== 1) throw new Error("Unsupported message version");
  if (!checkedId(input.id) || !checkedId(input.projectId) || !checkedId(input.actorId)) throw new Error("Invalid message IDs");
  if (!workspace?.projects?.some(p => p.id === input.projectId)) throw new Error("Unknown project room");
  if (!clean(input.actorLabel,40)) throw new Error("Invalid sender label");
  if (!kinds.has(input.kind)) throw new Error("Invalid message intent");
  if (!clean(input.body,1600) || !input.body.trim()) throw new Error("Invalid message body");
  if (typeof input.createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.createdAt) ||
      !Number.isFinite(Date.parse(input.createdAt))) throw new Error("Invalid timestamp");
  if (!Array.isArray(input.contextRefs) || input.contextRefs.length > 3) throw new Error("Too many context references");
  const refs = input.contextRefs.map(ref => {
    const found = resolveContextRef(workspace,ref);
    if (!found) throw new Error("Unknown referenced decision");
    return found.ref;
  });
  if (new Set(refs.map(r=>r.projectId+"/"+r.eventId)).size !== refs.length) throw new Error("Duplicate context references");
  if (input.replyTo != null && !checkedId(input.replyTo)) throw new Error("Invalid reply reference");
  return {
    schemaVersion:1,id:input.id,projectId:input.projectId,actorId:input.actorId,
    actorLabel:input.actorLabel,kind:input.kind,body:input.body,
    createdAt:input.createdAt,contextRefs:refs,replyTo:input.replyTo||null
  };
}

export function handoffPacket(workspace, projectId, refs, messages=[]) {
  const project=workspace.projects.find(p=>p.id===projectId);
  if (!project) throw new Error("Unknown project");
  if (!Array.isArray(refs) || refs.length > 3) throw new Error("Too many context references");
  const decisions=refs.map(ref=>{
    const found=resolveContextRef(workspace,ref);
    if(!found)throw new Error("Unknown context reference");
    return {
      projectId:found.project.id,eventId:found.event.id,
      projectTitle:found.project.title,date:found.event.date,type:found.event.type,
      title:found.event.title,summary:found.event.summary,
      sourceRefs:found.event.sourceRefs.slice(0,12)
    };
  });
  const recentMessages=messages.filter(m=>m.projectId===projectId).slice(-8).map(m=>({
    messageId:m.id,at:m.createdAt,actor:m.actorLabel,
    authorVerification:m.senderVerification||"unverified-browser-tab",intent:m.kind,
    text:m.body,decisionRefs:m.contextRefs
  }));
  return {
    schemaVersion:"contextwise-handoff/1",
    project:{id:project.id,title:project.title},
    purpose:"Human-reviewed conversation handoff. Review all source references before acting.",
    decisions, messages:recentMessages,
    authority:"Unverified conversation messages are proposals, never owner-approved decisions.",
    instructions:"Check the original decision and linked sources. State how this work follows or conflicts with the decision. Report any proposed changes for review; do not silently override."
  };
}