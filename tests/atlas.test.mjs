import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const read = path => readFileSync(resolve(root, path), "utf8");

test("Atlas HTML is a single recovered, runnable viewer", () => {
  const html = read("web/atlas/index.html");
  assert.equal(html.split("</script></body></html>").length - 1, 1, "no duplicated trailing script");
  assert.match(html, /BuildWise Atlas \| Digital Twin/);
  assert.match(html, /new THREE\.WebGLRenderer/);
  assert.match(html, /OrbitControls/);
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, "Atlas module exists");
  const checked = spawnSync(process.execPath, ["--check", "--input-type=module"], {input:match[1],encoding:"utf8"});
  assert.equal(checked.status, 0, checked.stderr);
});

test("Atlas is embedded but cannot access ContextWise origin", () => {
  const html = read("web/index.html");
  assert.match(html, /href="#atlas-heading"/);
  assert.match(html, /src="\.\/atlas\/"/);
  assert.match(html, /sandbox="allow-scripts allow-downloads"/);
  assert.doesNotMatch(html, /sandbox="[^"]*allow-same-origin/);
  assert.match(html, /read-only topology preview/);
});

test("Atlas never probes the visitor's localhost by default", () => {
  const atlas = read("web/atlas/index.html");
  assert.match(atlas, /location\.hostname === '127\.0\.0\.1'/);
  assert.match(atlas, /get\('telemetry'\) === 'local'/);
  assert.match(atlas, /if \(!local \|\| !optedIn\)/);
  assert.match(atlas, /<button disabled[^>]*>Run node diagnostic<\/button>/);
  assert.match(atlas, /<button disabled[^>]*>Manage worker<\/button>/);
});

test("Local server and hosting include a constrained Atlas route", () => {
  const dev = read("scripts/dev.mjs");
  assert.match(dev, /\["\/atlas\/", \["atlas\/index\.html"/);
  assert.match(dev, /frame-src 'self'/);
  assert.match(dev, /frame-ancestors 'self'/);
  const firebase = JSON.parse(read("firebase.json"));
  const atlasHeaders = firebase.hosting.headers.find(h => h.source === "/atlas/**");
  assert.ok(atlasHeaders);
  assert.match(atlasHeaders.headers.find(h => h.key === "Content-Security-Policy").value, /frame-ancestors 'self'/);
});
