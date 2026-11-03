import test from "node:test";
import assert from "node:assert/strict";
import { demoWorkspace } from "../web/src/demo.mjs";
import { visibleEvents,mostRecent } from "../web/src/model.mjs";
const project=demoWorkspace.projects[0];
test("zoom progressively discloses different kinds of history",()=>{
 assert.equal(visibleEvents(project,"overview").length,2);
 assert.equal(visibleEvents(project,"project").length,4);
 assert.equal(visibleEvents(project,"detail").length,5);
});
test("search returns relevant evidence and preserves dates",()=>{
 assert.equal(visibleEvents(project,"detail","format").length,1);
 assert.equal(mostRecent(project).id,"a5");
});
