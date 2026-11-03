// Pure graph functions: relationship data is validated by normalizeWorkspace.
export function eventAt(workspace, ref) {
  const project = workspace.projects.find(p => p.id === ref?.projectId);
  const event = project?.events.find(e => e.id === ref?.eventId);
  return project && event ? { project, event, ref } : null;
}

export function linksForEvent(workspace, ref) {
  return (workspace.relations || []).flatMap(relation => {
    const from = relation.fromRef.projectId === ref.projectId && relation.fromRef.eventId === ref.eventId;
    const to = relation.toRef.projectId === ref.projectId && relation.toRef.eventId === ref.eventId;
    if (!from && !to) return [];
    const neighbor = eventAt(workspace, from ? relation.toRef : relation.fromRef);
    return neighbor ? [{ relation, neighbor, direction: from ? "out" : "in" }] : [];
  });
}

export function linksForProject(workspace, projectId) {
  const projects = new Map(workspace.projects.map(project => [project.id, project]));
  const counts = new Map();
  for (const relation of workspace.relations || []) {
    const { fromRef, toRef } = relation;
    const peer = fromRef.projectId === projectId ? toRef.projectId
      : toRef.projectId === projectId ? fromRef.projectId : null;
    if (!peer || peer === projectId || !projects.has(peer)) continue;
    const entry = counts.get(peer) || { project: projects.get(peer), count: 0, relations: [] };
    entry.count++;
    entry.relations.push(relation);
    counts.set(peer, entry);
  }
  return [...counts.values()].sort((a,b) => b.count-a.count || a.project.title.localeCompare(b.project.title));
}

export function ideaMap(workspace, projectId, eventId = null) {
  const selected = workspace.projects.find(project => project.id === projectId);
  if (!selected) return { mode: "empty", title: "", nodes: [] };
  if (eventId) {
    const current = selected.events.find(event => event.id === eventId);
    const neighbors = current ? linksForEvent(workspace,{projectId,eventId}) : [];
    if (neighbors.length) {
      return {
        mode:"event", title:current.title,
        center:{projectId,eventId,title:current.title,projectTitle:selected.title},
        nodes: neighbors.map(link => ({
          projectId:link.neighbor.project.id,eventId:link.neighbor.event.id,
          title:link.neighbor.event.title,projectTitle:link.neighbor.project.title,
          label:link.relation.label,kind:link.relation.kind,relationId:link.relation.id
        }))
      };
    }
  }
  return {
    mode:"project", title:selected.title,
    center:{projectId,title:selected.title},
    nodes:linksForProject(workspace,projectId).map(({project,count})=>({
      projectId:project.id,title:project.title,count,label:`${count} connected idea${count===1?"":"s"}`
    }))
  };
}
