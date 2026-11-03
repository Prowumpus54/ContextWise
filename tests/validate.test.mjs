import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWorkspace } from "../web/src/validate.mjs";
import { demoWorkspace } from "../web/src/demo.mjs";
test("accepts synthetic workspace with isolated project IDs",()=>{
 const data=normalizeWorkspace(demoWorkspace);
 assert.equal(data.projects.length,2);
 assert.equal(data.projects[0].events.length,5);
});
test("rejects duplicate event identities",()=>{
 const bad=structuredClone(demoWorkspace);
 bad.projects[0].events[1].id=bad.projects[0].events[0].id;
 assert.throws(()=>normalizeWorkspace(bad),/Duplicate/);
});
test("rejects malformed date and unsafe data shape",()=>{
 const bad=structuredClone(demoWorkspace);
 bad.projects[0].events[0].date="2026-02-31";
 assert.throws(()=>normalizeWorkspace(bad),/date/);
 assert.throws(()=>normalizeWorkspace({schemaVersion:1,projects:[]}));
});
