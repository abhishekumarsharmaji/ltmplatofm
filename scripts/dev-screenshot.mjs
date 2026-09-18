// Usage: node shoot.mjs <cookieFile> <outPrefix> <width> <path1> [path2 ...]
// Logs in via API cookie jar (curl format), injects the session cookie through CDP, screenshots each path.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";

const [cookieFile, outPrefix, widthArg, ...paths] = process.argv.slice(2);
const width = Number(widthArg) || 1440;
const base = "http://127.0.0.1:80";

const jar = readFileSync(cookieFile, "utf8").split("\n").map(l => l.replace(/^#HttpOnly_/, "")).filter(l => l && !l.startsWith("#"));
const cookies = jar.map(l => { const p = l.split("\t"); return { name: p[5], value: p[6], url: base }; });

const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn("/repl/tools/bin/chromium", [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${port}`, `--window-size=${width},1000`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJson = (url) => new Promise((res, rej) => http.get(url, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on("error", rej));

let targets;
for (let i = 0; i < 40; i++) { try { targets = await getJson(`http://127.0.0.1:${port}/json`); break; } catch { await sleep(250); } }
const page = targets.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const mid = ++id; pending.set(mid, r); ws.send(JSON.stringify({ id: mid, method, params })); });

await send("Page.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
for (const c of cookies) await send("Network.setCookie", c);

for (const p of paths) {
  await send("Page.navigate", { url: base + p });
  await sleep(3500);
  const { result } = await send("Runtime.evaluate", { expression: "Math.min(document.documentElement.scrollHeight, 2600)", returnByValue: true }); const rv = result.result.value;
  const h = Math.max(800, rv);
  await send("Emulation.setDeviceMetricsOverride", { width, height: h, deviceScaleFactor: 1, mobile: width < 600 });
  await sleep(600);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70, captureBeyondViewport: true });
  const file = `${outPrefix}${p.replace(/[^a-z0-9]+/gi, "_")}.jpg`;
  writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  const { result: t } = await send("Runtime.evaluate", { expression: "document.title + ' | ' + location.pathname", returnByValue: true });
  console.log(file, "<-", t.result.value, "h=" + h);
  await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width < 600 });
}
ws.close();
chrome.kill();
