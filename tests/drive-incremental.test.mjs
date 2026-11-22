import test from "node:test";
import assert from "node:assert/strict";
import { isAvaIncrementalName, fetchAvaIncrementals } from "../web/src/drive-incremental.mjs";

test("recognizes both real Ava archive filename conventions", () => {
  const valid = [
    "ContextWise_Ava_Incremental_Archive_20261104T2021Z",
    "ContextWise_Ava_Incremental_Archive_20261105T0716Z_PRIVATE",
    "ContextWise_Ava_Incremental_20261105T082551Z_PRIVATE",
    "ContextWise_Ava_Incremental_20261105T232758Z_20261106T001923Z_PRIVATE",
    "ContextWise_Ava_Incremental_20261106T020338Z_20261106T025506Z_PRIVATE",
    "ContextWise_Ava_Incremental_Archive_20261106T0344Z",
  ];
  for (const filename of valid) {
    assert.equal(isAvaIncrementalName(filename), true, filename);
  }
  const invalid = [
    "ContextWise_Ava_Reconciliation_20261105T0520Z_PRIVATE",
    "ContextWise_Ava_Incremental_other_doc",
    "ContextWise_Ava_Incremental_20261106T0344Z_BACKUP",
    "SomeOther_Incremental_Archive_20261106T0344Z",
    "ContextWise_Ava_Incremental_Archive_20261106T0344Z.exe",
    null,
  ];
  for (const filename of invalid) {
    assert.equal(isAvaIncrementalName(filename), false, String(filename));
  }
});

test("fetches only matching Docs from the permitted folder with no writes", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({url:String(url), options});
    if (requests.length === 1) {
      return {ok:true, json:async()=>({files:[
        {id:"archive-old",name:"ContextWise_Ava_Incremental_Archive_20261105T0716Z_PRIVATE"},
        {id:"archive-new",name:"ContextWise_Ava_Incremental_20261106T020338Z_20261106T025506Z_PRIVATE"},
        {id:"unrelated",name:"ContextWise_Ava_Reconciliation_20261105T0520Z_PRIVATE"}
      ]})};
    }
    if (url.includes("archive-old")) return {ok:true,text:async()=>"old archive"};
    if (url.includes("archive-new")) return {ok:true,text:async()=>"new archive"};
    throw new Error("Unexpected URL");
  };
  try {
    const contents = await fetchAvaIncrementals("test-token", "chosen-folder");
    assert.deepEqual(contents, ["old archive", "new archive"]);
    assert.equal(requests.length, 3);
    const query = new URL(requests[0].url).searchParams.get("q");
    assert.match(query, /'chosen-folder' in parents/);
    assert.match(query, /name contains 'ContextWise_Ava_Incremental_'/);
    for (const request of requests) {
      assert.equal(request.options.headers.Authorization, "Bearer test-token");
      assert.equal(request.options.method, undefined);
      assert.ok(!request.options.body);
      assert.ok(!request.url.includes("unrelated"));
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects partial paginated lists rather than silently omitting archives", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ok:true,json:async()=>({nextPageToken:"another-page",files:[]})});
  try {
    await assert.rejects(fetchAvaIncrementals("token","folder"),/incomplete import/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
