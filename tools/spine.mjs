import { chromium } from "playwright";
import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { extname, join } from "path";
const ROOT = new URL("../dist/", import.meta.url).pathname;
const BASE = "/Peyton_Lindogan_Resume/";
const T = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".svg":"image/svg+xml", ".png":"image/png", ".pdf":"application/pdf", ".woff2":"font/woff2" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.startsWith(BASE)) p = p.slice(BASE.length - 1);
  if (p.endsWith("/")) p += "index.html";
  try { const f = join(ROOT, p); await stat(f);
    res.writeHead(200, {"Content-Type": T[extname(f)] || "application/octet-stream"});
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end("no"); }
});
await new Promise(r => server.listen(4601, r));
const b = await chromium.launch({ executablePath: process.env.PW_CHROME });
const page = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(`http://localhost:4601${BASE}`, { waitUntil: "networkidle" });
// Light every section so the whole conductor reads at once.
await page.evaluate(() => document.querySelectorAll(".section").forEach(s => s.classList.add("is-live")));
await page.waitForTimeout(2500);
await page.screenshot({ path: "tools/shots/spine-full.png", fullPage: true });
// And a tight crop of just the conductor.
await page.screenshot({ path: "tools/shots/spine-crop.png", fullPage: true, clip: { x: 0, y: 900, width: 230, height: 5200 } });
await b.close(); server.close();
console.log("spine captured");
