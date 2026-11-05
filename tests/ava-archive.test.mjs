import test from "node:test";
import assert from "node:assert/strict";
import { parseAvaArchive, mergeAvaRecords } from "../web/src/ava-archive.mjs";

const a="d196d527-2ece-45a7-83c7-9a5bf77c2b4a";
const b="298d4971-2f2f-4cff-b726-b73352652712";
const record=(id,classification="verified_bulletin")=>JSON.stringify({
  sourceMessageId:id,at:"2026-11-04T16:30:52.479491Z",classification,
  summary:"Reviewed a release candidate; certification still pending."
});
const doc=(...lines)=>["CONTEXTWISE AVA INCREMENTAL ARCHIVE","schema: 1",...lines].join("\r\n");

test("parses native Docs text export with valid bulletin source IDs",()=>{
  const result=parseAvaArchive(doc(record(a),record(b,"reported")));
  assert.equal(result.length,2);
  assert.equal(result[0].date,"2026-11-04");
  assert.equal(result[1].classification,"reported");
});
test("rejects untrusted unrelated documents, duplicate IDs, and malformed dates",()=>{
  assert.throws(()=>parseAvaArchive("Not ContextWise\n"+record(a)));
  assert.throws(()=>parseAvaArchive(doc(record(a),record(a))),/duplicate/i);
  assert.throws(()=>parseAvaArchive(doc(JSON.stringify({sourceMessageId:a,at:"broken",classification:"reported",summary:"test"}))),/timestamp/i);
});
test("merges same bulletin ID once across docs, preserving existing projects",()=>{
  const base={schemaVersion:1,projects:[{id:"buildwise",title:"BuildWise",description:"Existing",events:[
    {id:"legacy",date:"2026-11-03",type:"note",title:"Legacy",summary:"Keep this",sourceRefs:[]}
  ]},{id:"tasker",title:"Tasker",description:"Unaffected",events:[]}],relations:[]};
  const first=mergeAvaRecords(base,[doc(record(a)),doc(record(a),record(b))]);
  assert.equal(first.added,2);
  assert.equal(first.workspace.projects.length,2);
  assert.equal(first.workspace.projects[0].events.length,3);
  assert.equal(base.projects[0].events.length,1);
  const again=mergeAvaRecords(first.workspace,[doc(record(a),record(b))]);
  assert.equal(again.added,0);
  assert.equal(again.workspace.projects[0].events.length,3);
});
test("incremental-only import creates BuildWise project and keeps provenance",()=>{
  const {workspace,added}=mergeAvaRecords(null,[doc(record(a))]);
  assert.equal(added,1);
  assert.equal(workspace.projects[0].id,"buildwise");
  assert.match(workspace.projects[0].events[0].sourceRefs.join(" "),new RegExp(a));
  assert.equal(workspace.projects[0].events[0].type,"note");
});

test("preserves complete native sourceRecord and rejects mismatched source IDs",()=>{
  const sourceRecord={schema_version:1,message_id:a,thread_id:a,reply_to:null,created_at:"2026-11-04T16:30:52.479491Z",author:"chat:fixture",kind:"evidence",stage_id:"S04",action_id:"S04-A06",body:"Sanitized fixture",references:["fixture"]};
  const archived=JSON.stringify({sourceMessageId:a,at:sourceRecord.created_at,classification:"verified_bulletin",summary:"Sanitized fixture",sourceRecord});
  const parsed=parseAvaArchive(doc(archived));
  assert.deepEqual(parsed[0].sourceRecord,sourceRecord);
  assert.equal(parsed[0].at,sourceRecord.created_at);
  const mismatch=JSON.stringify({sourceMessageId:b,at:sourceRecord.created_at,classification:"verified_bulletin",summary:"Sanitized fixture",sourceRecord});
  assert.throws(()=>parseAvaArchive(doc(mismatch)),/does not match/i);
  const once=mergeAvaRecords(null,[doc(archived)]);
  assert.equal(once.added,1);
  assert.equal(mergeAvaRecords(once.workspace,[doc(archived)]).added,0);
});

test("historical Ava archive shapes preserve source records and retry idempotently",()=>{
  const legacy={sourceMessageId:a,threadId:b,replyTo:null,at:"2026-11-04T19:50:41.452Z",author:"chat:fixture",kind:"note",classification:"reported",body:"Historical fixture",references:["fixture"]};
  const native={schema_version:1,message_id:b,thread_id:a,reply_to:null,created_at:"2026-11-04T21:36:04.089360Z",author:"chat:fixture",kind:"handoff",stage_id:null,action_id:null,body:"Native fixture",references:["fixture"]};
  const legacyDoc="\\uFEFFCONTEXTWISE AVA INCREMENTAL ARCHIVE\\nSynthetic fixture\\n"+JSON.stringify(legacy);
  const nativeDoc="\\uFEFFContextWise Ava incremental archive | 2026-11-04 operational day\\nSynthetic fixture\\n"+JSON.stringify(native);
  const first=mergeAvaRecords(null,[legacyDoc,nativeDoc]);
  assert.equal(first.added,2);
  const events=first.workspace.projects[0].events;
  assert.equal(events.length,2);
  assert.deepEqual(events.find(e=>e.id==="bw-"+b).sourceRecord,native);
  assert.equal(events.find(e=>e.id==="bw-"+a).at,legacy.at);
  assert.equal(mergeAvaRecords(first.workspace,[legacyDoc,nativeDoc]).added,0);
});
