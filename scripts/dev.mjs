import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../web");
const allowed = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/src/app.mjs", ["src/app.mjs", "text/javascript; charset=utf-8"]],
  ["/src/model.mjs", ["src/model.mjs", "text/javascript; charset=utf-8"]],
  ["/src/validate.mjs", ["src/validate.mjs", "text/javascript; charset=utf-8"]],
  ["/src/context.mjs", ["src/context.mjs", "text/javascript; charset=utf-8"]],
  ["/src/demo.mjs", ["src/demo.mjs", "text/javascript; charset=utf-8"]]
]);
const port = Number(process.env.PORT ?? 4173);
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const asset = allowed.get(url.pathname);
  if (req.method !== "GET" || !asset) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  try {
    const bytes = await readFile(join(root, asset[0]));
    res.writeHead(200, {
      "Content-Type": asset[1],
      "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store"
    });
    res.end(bytes);
  } catch {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Unable to load application asset");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`ContextWise prototype: http://127.0.0.1:${port}`));
