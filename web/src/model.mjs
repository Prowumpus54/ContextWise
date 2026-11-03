const levels = {
  overview: new Set(["milestone"]),
  project: new Set(["milestone","decision","blocker"]),
  detail: new Set(["milestone","decision","blocker","note"])
};
export function visibleEvents(project, level="overview", query="") {
  if (!levels[level]) throw new Error("Unknown timeline zoom level");
  const needle = String(query).trim().toLocaleLowerCase();
  return project.events.filter(event => levels[level].has(event.type) &&
    (!needle || [event.title,event.summary,event.type,event.date,...event.sourceRefs]
      .some(value => value.toLocaleLowerCase().includes(needle))))
    .sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function mostRecent(project) {
  const events = visibleEvents(project,"detail");
  return events.length ? events[events.length-1] : null;
}
