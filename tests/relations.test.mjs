import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeWorkspace } from "../web/src/validate.mjs";
import { ideaMap, linksForEvent, linksForProject } from "../web/src/graph.mjs";

const dataset = {
  schemaVersion:1,
  projects:[
    {id:"buildwise",title:"BuildWise",description:"",events:[
      {id:"bw1",date:"2026-10-28",type:"milestone",title:"Milestone gateway",summary:"Scoped handoff",sourceRefs:["github://example"]},
      {id:"bw2",date:"2026-11-02",type:"decision",title:"Factory authority",summary:"Separate review",sourceRefs:[]}
    ]},
    {id:"tasker",title:"Tasker",description:"",events:[
      {id:"t1",date:"2026-10-28",type:"milestone",title:"Review inbox",summary:"Tracks tasks",sourceRefs:[]}
    ]}
  ],
  relations:[
    {id:"r1",fromRef:{projectId:"buildwise",eventId:"bw1"},
      toRef:{projectId:"tasker",eventId:"t1"},kind:"coordinates",
      label:"Factory milestones link to Tasker review",sourceRefs:["source ref"]}
  ]
};
test("normalizer preserves and validates cross-project event links",()=>{
  const x=normalizeWorkspace(dataset);
  assert.equal(x.relations.length,1);
  assert.equal(x.relations[0].kind,"coordinates");
  assert.equal(linksForEvent(x,{projectId:"tasker",eventId:"t1"})[0].neighbor.event.id,"bw1");
  assert.equal(linksForProject(x,"buildwise")[0].project.id,"tasker");
});
test("graph moves between project and event relationship views",()=>{
  const x=normalizeWorkspace(dataset);
  assert.equal(ideaMap(x,"buildwise").nodes.length,1);
  assert.equal(ideaMap(x,"buildwise","bw1").mode,"event");
  assert.equal(ideaMap(x,"buildwise","bw1").nodes[0].projectTitle,"Tasker");
  assert.equal(ideaMap(x,"buildwise","bw2").mode,"project");
});
test("reject dangling or invalid relationships before importing",()=>{
  for (const change of [
    {toRef:{projectId:"tasker",eventId:"missing"}},
    {fromRef:{projectId:"buildwise",eventId:"bw1"},toRef:{projectId:"buildwise",eventId:"bw1"}},
    {kind:"runs_arbitrary_code"}
  ]) {
    const invalid=structuredClone(dataset);
    Object.assign(invalid.relations[0],change);
    assert.throws(()=>normalizeWorkspace(invalid));
  }
});
test("legacy schema v1 archives remain importable",()=>{
  const legacy=structuredClone(dataset);
  delete legacy.relations;
  assert.deepEqual(normalizeWorkspace(legacy).relations,[]);
});
