import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeWorkspace } from "../web/src/validate.mjs";
import { contextChoices, resolveContextRef, validateRoomMessage, handoffPacket } from "../web/src/conversation.mjs";
const workspace=normalizeWorkspace({
  schemaVersion:1,projects:[
    {id:"buildwise",title:"BuildWise",events:[
      {id:"d1",date:"2026-10-28",type:"decision",title:"Use owner grants",summary:"Keep scoped owner authority.",sourceRefs:["commit:abc"]},
      {id:"m1",date:"2026-10-29",type:"milestone",title:"Broker prototyped",summary:"Draft only.",sourceRefs:[]}
    ]},
    {id:"vaultwise",title:"VaultWise",events:[
      {id:"v1",date:"2026-10-30",type:"decision",title:"Protected credentials",summary:"Never export keys.",sourceRefs:["audit:test"]}
    ]}
  ],
  relations:[{id:"e1",fromRef:{projectId:"buildwise",eventId:"d1"},toRef:{projectId:"vaultwise",eventId:"v1"},
    kind:"coordinates",label:"Authorization dependency",sourceRefs:["commit:abc"]}]
});
const message=()=>({
  schemaVersion:1,id:"msg_1",projectId:"buildwise",actorId:"tab_1",
  actorLabel:"Local participant",kind:"question",body:"Does this affect T15?",
  createdAt:"2026-11-03T04:00:00.000Z",
  contextRefs:[{projectId:"buildwise",eventId:"d1"}],replyTo:null
});
test("context choices include linked cross-project decisions",()=>{
  const options=contextChoices(workspace,"buildwise");
  assert.ok(options.some(x=>x.projectId==="vaultwise"&&x.eventId==="v1"));
  assert.ok(options.some(x=>x.projectId==="buildwise"&&x.eventId==="d1"));
  assert.equal(resolveContextRef(workspace,{projectId:"vaultwise",eventId:"v1"}).event.title,"Protected credentials");
});
test("validated local chat message retains source IDs, not caller-controlled extra fields",()=>{
  const m={...message(),secretToken:"should-not-copy"};
  const normalized=validateRoomMessage(m,workspace);
  assert.equal(normalized.secretToken,undefined);
  assert.deepEqual(normalized.contextRefs,[{projectId:"buildwise",eventId:"d1"}]);
  assert.equal(normalized.kind,"question");
});
test("message rejects missing/oversized content and invented decision references",()=>{
  for(const changes of [
    {body:""},{body:"x".repeat(1601)},{kind:"owner-approved"},
    {actorLabel:"x".repeat(41)},{id:"../../private"},
    {contextRefs:[{projectId:"buildwise",eventId:"missing"}]},
    {contextRefs:Array(4).fill({projectId:"buildwise",eventId:"d1"})},
    {replyTo:"not safe"},{createdAt:"yesterday"},
    {contextRefs:[{projectId:"buildwise",eventId:"d1"},{projectId:"buildwise",eventId:"d1"}]}
  ]) assert.throws(()=>validateRoomMessage({...message(),...changes},workspace));
});
test("handoff cites exact decisions and clarifies unverified chat authority",()=>{
  const normalized=validateRoomMessage(message(),workspace);
  const packet=handoffPacket(workspace,"buildwise",[{projectId:"vaultwise",eventId:"v1"}],[normalized]);
  assert.equal(packet.schemaVersion,"contextwise-handoff/1");
  assert.deepEqual(packet.decisions[0].sourceRefs,["audit:test"]);
  assert.equal(packet.messages[0].messageId,"msg_1");
  assert.match(packet.authority,/never owner-approved/);
  assert.match(packet.instructions,/Check the original decision/);
  assert.throws(()=>handoffPacket(workspace,"buildwise",[{projectId:"buildwise",eventId:"missing"}]));
});
test("UI uses an authenticated backend instead of untrusted same-browser channels",()=>{
  const ui=readFileSync(new URL("../web/src/conversation-ui.mjs",import.meta.url),"utf8");
  assert.equal(ui.includes("new BroadcastChannel("),false);
  assert.ok(ui.includes("createRelayClient()"));
  assert.ok(ui.includes("api.post("));
  assert.ok(ui.includes("api.read("));
  assert.equal(ui.includes("XMLHttpRequest"),false);
  assert.equal(ui.includes("sendBeacon("),false);
  assert.equal(ui.includes("localStorage"),false);
  assert.ok(ui.includes("window.contextwiseCurrentUid"));
});

test("decision inspector and web room are wired without a new top-level module",()=>{
  const app=readFileSync(new URL("../web/src/app.mjs",import.meta.url),"utf8");
  const html=readFileSync(new URL("../web/index.html",import.meta.url),"utf8");
  const dev=readFileSync(new URL("../scripts/dev.mjs",import.meta.url),"utf8");
  assert.ok(app.includes('import { initConversationRoom } from "./conversation-ui.mjs"'));
  assert.ok(app.includes("conversationRoom?.focusDecision("));
  for(const id of ["conversation-compose","conversation-ref","conversation-messages","conversation-copy","conversation-publish"])
    assert.ok(html.includes('id="'+id+'"'));
  assert.ok(dev.includes('"/src/conversation-ui.mjs"'));
  assert.ok(dev.includes('"/src/conversation.mjs"'));
  assert.ok(dev.includes('"/src/relay-client.mjs"'));
});
test("handoff limits retained chat and only includes the active project",()=>{
  const local=validateRoomMessage(message(),workspace);
  const other=validateRoomMessage({...message(),id:"elsewhere",projectId:"vaultwise",contextRefs:[]},workspace);
  const packet=handoffPacket(workspace,"buildwise",[],[other,...Array.from({length:13},(_,i)=>({...local,id:"message_"+i}))]);
  assert.equal(packet.messages.length,8);
  assert.equal(packet.messages.some(m=>m.messageId==="elsewhere"),false);
  assert.equal(packet.decisions.length,0);
});