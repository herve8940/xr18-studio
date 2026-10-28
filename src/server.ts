import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { XR18 } from "./xr18.js";
const mode = process.env.XR18_MODE === "real" ? "real" : "simulation";
const xr18 = new XR18({ mode, host: process.env.XR18_HOST ?? "192.168.1.100", port: Number(process.env.XR18_PORT ?? 10024), enableWrites: process.env.XR18_ENABLE_WRITES === "true" });
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  // Bound to loopback by default; no authentication yet. Do not expose this API.
  if (req.method === "GET" && path === "/api/status") { res.end(JSON.stringify(xr18.status())); return; }
  if (req.method === "GET" && path === "/api/channels") { res.end(JSON.stringify(xr18.listChannels())); return; }
  if (req.method === "POST" && /^\/api\/channels\/\d+\/fader$/.test(path)) {
    let raw = "";
    for await (const part of req) { raw += part; if (raw.length > 1024) { res.writeHead(413); res.end(JSON.stringify({ error: "Payload too large" })); return; } }
    try {
      const body: unknown = JSON.parse(raw);
      if (!body || typeof body !== "object" || !("value" in body) || typeof body.value !== "number") throw new Error("Numeric value required");
      xr18.setFader(Number(path.split("/")[3]), body.value);
      res.end(JSON.stringify({ ok: true, note: mode === "real" ? "OSC command sent, not acknowledged" : "Simulation updated" }));
    } catch (e) { res.writeHead(400); res.end(JSON.stringify({ error: (e as Error).message })); }
    return;
  }
  res.writeHead(404); res.end(JSON.stringify({ error: "Not found" }));
});
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", ws => ws.send(JSON.stringify({ type: "snapshot", channels: xr18.listChannels(), status: xr18.status() })));
xr18.on("state", state => { const message = JSON.stringify({ type: "channel", state }); for (const ws of wss.clients) if (ws.readyState === WebSocket.OPEN) ws.send(message); });
xr18.on("warning", warning => console.warn("[OSC]", warning));
await xr18.start();
const port = Number(process.env.HTTP_PORT ?? 3000);
server.listen(port, "127.0.0.1", () => console.log(`XR18 Studio API on http://127.0.0.1:${port} (${mode})`));
process.on("SIGINT", () => { xr18.close(); server.close(); });
