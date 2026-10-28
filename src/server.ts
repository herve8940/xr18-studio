import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { XR18 } from "./xr18.js";
import { ProcessingStore } from "./processing.js";
import { StudioDatabase } from "./database.js";
const database = new StudioDatabase();
const processing = new ProcessingStore();
const mode = process.env.XR18_MODE === "real" ? "real" : "simulation";
const xr18 = new XR18({ mode, host: process.env.XR18_HOST ?? "192.168.1.100", port: Number(process.env.XR18_PORT ?? 10024), enableWrites: process.env.XR18_ENABLE_WRITES === "true" });
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  // Bound to loopback by default; no authentication yet. Do not expose this API.
  if (req.method === "GET" && path === "/api/status") { res.end(JSON.stringify(xr18.status())); return; }
  if (req.method === "GET" && path === "/api/channels") { res.end(JSON.stringify(xr18.listChannels())); return; }
  // Rehearsal data is persisted in local SQLite. API is loopback-only and unauthenticated.
  const resource = /^\/api\/(songs|rehearsals|setlists)(?:\/([a-zA-Z0-9-]+))?$/.exec(path);
  if (resource) {
    const kind=resource[1],itemId=resource[2];
    try {
      if (req.method==="GET"&&!itemId) {
        const data=kind==="songs"?database.listSongs():kind==="rehearsals"?database.listRehearsals():database.listSetlists();
        res.end(JSON.stringify(data));return;
      }
      if (req.method==="DELETE"&&itemId&&kind!=="rehearsals") {
        const deleted=kind==="songs"?database.deleteSong(itemId):database.deleteSetlist(itemId);
        res.writeHead(deleted?200:404);res.end(JSON.stringify({ok:deleted}));return;
      }
      if (req.method==="POST"&&!itemId) {
        let raw="";for await(const part of req){raw+=part;if(raw.length>20000){res.writeHead(413);res.end(JSON.stringify({error:"Payload too large"}));return;}}
        const body:unknown=JSON.parse(raw);
        if(!body||typeof body!=="object"||Array.isArray(body))throw Error("Invalid JSON body");
        const data=body as Record<string,unknown>;
        const result=kind==="songs"?database.addSong(data):kind==="rehearsals"?database.addRehearsal(data):database.addSetlist(data);
        res.writeHead(201);res.end(JSON.stringify(result));return;
      }
      res.writeHead(405);res.end(JSON.stringify({error:"Method not allowed"}));return;
    } catch(e){res.writeHead(400);res.end(JSON.stringify({error:(e as Error).message}));return;}
  }
  const processingMatch = /^\/api\/channels\/(\d+)\/processing(?:\/(preview|undo))?$/.exec(path);
  if (processingMatch) {
    const channel = Number(processingMatch[1]);
    try {
      if (req.method === "GET" && !processingMatch[2]) { res.end(JSON.stringify({ state: processing.get(channel), simulationOnly: true })); return; }
      if (req.method !== "POST") { res.writeHead(405); res.end(JSON.stringify({ error: "Method not allowed" })); return; }
      let raw = "";
      for await (const part of req) { raw += part; if (raw.length > 16000) { res.writeHead(413); res.end(JSON.stringify({ error: "Payload too large" })); return; } }
      const body: unknown = JSON.parse(raw);
      if (!body || typeof body !== "object") throw Error("Invalid JSON");
      const data = body as Record<string,unknown>;
      if (processingMatch[2] === "preview") { res.end(JSON.stringify(processing.preview(channel,data.processing))); return; }
      if (mode !== "simulation") { res.writeHead(403); res.end(JSON.stringify({ error: "Processing hardware writes are not implemented or validated; simulation only" })); return; }
      if (processingMatch[2] === "undo") {
        if (!Number.isInteger(data.expectedRevision)) throw Error("expectedRevision required");
        const state = processing.undo(channel,data.expectedRevision as number);
        res.end(JSON.stringify({ state, simulationOnly: true })); return;
      }
      if (data.confirm !== true || !Number.isInteger(data.expectedRevision)) throw Error("Explicit confirmation and expectedRevision required");
      const state = processing.apply(channel,data.processing,data.expectedRevision as number);
      res.end(JSON.stringify({ state, simulationOnly: true })); return;
    } catch(e) { const message=(e as Error).message;res.writeHead(message.includes("conflict")?409:400);res.end(JSON.stringify({ error: message }));return; }
  }
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
process.on("SIGINT", () => { xr18.close(); database.close(); server.close(); });
