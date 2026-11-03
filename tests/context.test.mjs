import test from "node:test";
import assert from "node:assert/strict";
import { demoWorkspace } from "../web/src/demo.mjs";
import { buildContextBundle } from "../web/src/context.mjs";
test("export respects project boundary and includes sources",()=>{
 const text=buildContextBundle(demoWorkspace.projects[0]);
 assert.match(text,/Aurora Workspace/);
 assert.match(text,/example:release-0.1/);
 assert.doesNotMatch(text,/Northstar Notes/);
 assert.match(text,/No AI service received this export/);
});
test("history limit is enforced",()=>{
 const text=buildContextBundle(demoWorkspace.projects[0],{maxEvents:2});
 assert.doesNotMatch(text,/Project created/);
 assert.match(text,/Timeline prototype completed/);
 assert.throws(()=>buildContextBundle(demoWorkspace.projects[0],{maxEvents:999}));
});
