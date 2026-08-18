import { chromium } from "playwright";
import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { extname, join } from "path";

const ROOT = new URL("../dist/", import.meta.url).pathname;
const BASE = process.env.SITE_BASE ?? "/Peyton_Lindogan_Resume/";
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf" };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.startsWith(BASE)) p = p.slice(BASE.length - 1);
  if (p.endsWith("/")) p += "index.html";
  const file = join(ROOT, p);
  try {
    await stat(file);
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end("nope");
  }
});
await new Promise((r) => server.listen(4599, r));

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const shots = [
  ["desktop-home", { width: 1440, height: 900 }, "", 0],
  ["desktop-focus", { width: 1440, height: 900 }, "", 1050],
  ["desktop-home-metrics", { width: 1440, height: 900 }, "", 3400],
  ["desktop-projects", { width: 1440, height: 900 }, "projects.html", 0],
  ["desktop-projects-mid", { width: 1440, height: 900 }, "projects.html", 1100],
  ["mobile-home", { width: 390, height: 844 }, "", 0],
  ["mobile-home-mid", { width: 390, height: 844 }, "", 1500],
  ["mobile-projects", { width: 390, height: 844 }, "projects.html", 900],
];
for (const [name, viewport, path, scroll] of shots) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:4599${BASE}${path}`, { waitUntil: "networkidle" });
  if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `tools/shots/${name}.png` });
  await page.close();
}
await browser.close();
server.close();
console.log("shots done");
