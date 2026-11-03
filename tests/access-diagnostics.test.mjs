import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read = p => readFileSync(new URL("../"+p,import.meta.url),"utf8");
function boot() {
  const listeners = new Map();
  const window = {
    addEventListener(type,listener){const list=listeners.get(type)||[];list.push(listener);listeners.set(type,list);},
    dispatchEvent(){}
  };
  class Event { constructor(type){this.type=type;} }
  vm.runInNewContext(read("web/src/boot.js"),{window,Event,Date,Set});
  return {window,emit(type,event){(listeners.get(type)||[]).forEach(fn=>fn(event));}};
}
test("site access report records only bounded anonymous local events",()=>{
  const {window}=boot();
  const d=window.contextwiseAccessDiagnostics;
  assert.equal(d.capture,"this-browser-tab-only");
  window.contextwiseRecordAccess("auth","attempt");
  window.contextwiseRecordAccess("auth","failed","auth/unauthorized-domain");
  window.contextwiseRecordAccess("auth","canceled","auth/popup-closed-by-user");
  window.contextwiseRecordAccess("auth","success");
  window.contextwiseRecordAccess("drive","attempt");
  window.contextwiseRecordAccess("drive","failed","PERMISSION_DENIED");
  window.contextwiseRecordAccess("archive","attempt");
  window.contextwiseRecordAccess("archive","failed","403");
  for(let i=0;i<24;i++)window.contextwiseRecordAccess("page","opened");
  assert.equal(d.events.length,16);
  assert.equal(d.authAttempts,1);
  assert.equal(d.authSuccesses,1);
  assert.equal(d.authFailures,1);
  assert.equal(d.authCanceled,1);
  assert.equal(d.driveFailures,1);
  assert.equal(d.archiveFailures,1);
  assert.equal(d.events.at(-1).category,"page");
});
test("access diagnostics reject arbitrary event categories and sensitive error messages",()=>{
  const {window}=boot();
  window.contextwiseRecordAccess("unknown","failed","private");
  window.contextwiseRecordAccess("auth","failed","refresh_token=super-private-secret");
  window.contextwiseRecordAccess("auth","failed","user@example.com");
  const json=JSON.stringify(window.contextwiseAccessDiagnostics);
  assert.equal(json.includes("super-private-secret"),false);
  assert.equal(json.includes("user@example.com"),false);
  assert.equal(window.contextwiseAccessDiagnostics.authFailures,2);
  assert.equal(window.contextwiseAccessDiagnostics.events.length,3);
});
test("page errors and missing resources are diagnosable without URLs",()=>{
  const {window,emit}=boot();
  emit("error",{target:{tagName:"SCRIPT",dataset:{module:"auth"}}});
  emit("error",{target:{tagName:"IMG"}});
  emit("error",{target:null,message:"Failed to fetch some sensitive URL"});
  emit("unhandledrejection",{});
  assert.equal(window.contextwiseBoot.moduleErrors.length,2);
  assert.equal(window.contextwiseBoot.runtimeErrors,1);
  assert.equal(window.contextwiseBoot.promiseRejections,1);
  assert.equal(window.contextwiseAccessDiagnostics.resourceFailures,2);
  assert.equal(JSON.stringify(window.contextwiseAccessDiagnostics).includes("sensitive URL"),false);
});
test("access telemetry is not silently transmitted",()=>{
  const js=read("web/src/boot.js");
  assert.ok(!/\bfetch\s*\(/.test(js));
  assert.ok(!/\blocalStorage\b/.test(js));
  assert.ok(!/\bXMLHttpRequest\b|\bsendBeacon\b/.test(js));
  const html=read("web/index.html");
  assert.ok(html.includes('id="access-status"'));
  assert.ok(read("web/src/diagnostics.mjs").includes("accessDiagnostics:"));
});
