import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read = p => readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("private Drive loader requires explicit user interaction and readonly scope",()=>{
  const html=read("web/index.html");
  const src=read("web/src/drive.mjs");
  assert.ok(html.includes('id="drive-load"'));
  assert.ok(html.includes("covers more than the ContextWise folder"));
  assert.ok(src.includes('loadButton.addEventListener("click"'));
  assert.ok(src.includes("https://www.googleapis.com/auth/drive.readonly"));
  assert.ok(src.includes("normalizeWorkspace(raw)"));
  assert.ok(src.includes('contextwise:workspace-loaded'));
  assert.ok(!src.includes("localStorage"));
});
test("private archives do not ship as static website files",()=>{
  const html=read("web/index.html");
  assert.ok(!html.includes("contextwise-workspace-20261103-buildwise"));
  assert.ok(!html.includes("tasker_complete_development_history"));
  assert.ok(read("firebase.json").includes('"public": "web"'));
});
