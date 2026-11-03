import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const html = read("web/index.html");
const pkg = JSON.parse(read("package.json"));
const diagnostics = read("web/src/diagnostics.mjs");
const firebase = JSON.parse(read("firebase.json"));

test("every top-level module is versioned consistently with the package and footer", () => {
  const urls = [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"/g)].map(m => m[1]);
  assert.equal(urls.length, 5);
  const expected = ["app", "auth", "storage", "drive", "diagnostics"].map(name => `./src/${name}.mjs?v=${pkg.version}`);
  assert.deepEqual(urls, expected);
  assert.match(html, new RegExp(`id="footer-version">v${pkg.version.replaceAll(".", "\\.")}</span>`));
  assert.match(diagnostics, new RegExp(`const VERSION = "${pkg.version.replaceAll(".", "\\.")}";`));
});

test("dependent modules import the exact same versioned auth module", () => {
  for (const name of ["storage", "drive"]) {
    const source = read(`web/src/${name}.mjs`);
    assert.ok(source.includes(`from "./auth.mjs?v=${pkg.version}"`), `${name} must import the same auth module as index.html`);
    assert.equal(source.includes('from "./auth.mjs";'), false);
  }
});

test("boot monitor starts before app modules and no-store headers prevent stale JS", () => {
  assert.ok(html.indexOf("window.contextwiseBoot =") < html.indexOf('data-module="app"'));
  assert.ok(html.includes('data-module="storage"'));
  const js = firebase.hosting.headers.find(h => h.source === "**/*.mjs");
  assert.ok(js.headers.some(h => h.key === "Cache-Control" && h.value.includes("no-store")));
});
