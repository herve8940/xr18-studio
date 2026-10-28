import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
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
  if (req.method === "GET" && path === "/api/meters") {res.end(JSON.stringify(xr18.meterState()));return;}
  if (req.method === "GET" && path === "/api/channels") { res.end(JSON.stringify(xr18.listChannels())); return; }
  if(req.method==="GET"&&path==="/api/main"){res.end(JSON.stringify(xr18.mainState()));return;}
  const mixerWrite=/^\/api\/(?:channels\/(\d+)\/(on)|main\/(fader|on))$/.exec(path);
  if(req.method==="POST"&&mixerWrite){
    try{
      let raw="";for await(const part of req){raw+=part;if(raw.length>1024)throw Error("Payload too large");}
      const data:unknown=JSON.parse(raw);if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Invalid body");
      const value=(data as Record<string,unknown>).value;
      if(mixerWrite[2]==="on"||mixerWrite[3]==="on"){
        if(typeof value!=="boolean")throw Error("Boolean value required");
        if(mixerWrite[1])xr18.setOn(Number(mixerWrite[1]),value);else xr18.setMainOn(value);
      }else{
        if(typeof value!=="number")throw Error("Numeric value required");
        xr18.setMainFader(value);
      }
      res.end(JSON.stringify({ok:true,acknowledged:mode==="simulation"}));return;
    }catch(e){res.writeHead(400);res.end(JSON.stringify({error:(e as Error).message}));return;}
  }
  if(req.method==="GET"&&path==="/api/osc/advanced"){res.end(JSON.stringify({values:xr18.advancedState(),readOnly:true,verifiedOnHardware:false}));return;}
  const advancedMatch=/^\/api\/osc\/advanced\/channels\/(\d+)\/refresh$/.exec(path);
  if(req.method==="POST"&&advancedMatch){try{xr18.refreshAdvanced(Number(advancedMatch[1]));res.end(JSON.stringify({ok:true,readOnly:true}));}catch(e){res.writeHead(400);res.end(JSON.stringify({error:(e as Error).message}));}return;}
  if(req.method==="POST"&&path==="/api/osc/advanced/fx/refresh"){xr18.refreshFx();res.end(JSON.stringify({ok:true,readOnly:true}));return;}
  const earsMatch=/^\/api\/ears\/profiles(?:\/([a-f0-9-]+))?$/.exec(path);
  if(earsMatch){
    try{
      if(req.method==="GET"&&!earsMatch[1]){res.end(JSON.stringify({profiles:database.listEarProfiles(),simulationOnly:true}));return;}
      if(req.method==="DELETE"&&earsMatch[1]){const deleted=database.deleteEarProfile(earsMatch[1]);res.writeHead(deleted?200:404);res.end(JSON.stringify({ok:deleted}));return;}
      if(req.method==="POST"&&!earsMatch[1]){
        let raw="";for await(const part of req){raw+=part;if(raw.length>8000){res.writeHead(413);res.end(JSON.stringify({error:"Payload too large"}));return;}}
        const data:unknown=JSON.parse(raw);if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Invalid JSON body");
        const profile=database.saveEarProfile(data as Record<string,unknown>);
        res.writeHead(201);res.end(JSON.stringify({profile,simulationOnly:true,hardwareWrite:false}));return;
      }
      res.writeHead(405);res.end(JSON.stringify({error:"Method not allowed"}));return;
    }catch(e){res.writeHead(400);res.end(JSON.stringify({error:(e as Error).message}));return;}
  }
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
  // Serve the prebuilt web UI in desktop / production mode; API stays loopback-only.
  if (req.method === "GET" && process.env.XR18_WEB_DIST && !path.startsWith("/api/")) {
    const root=resolve(process.env.XR18_WEB_DIST);
    const requested=resolve(root,"."+path);
    if(requested===root||requested.startsWith(root+sep)){
      try{
        const target=(await stat(requested)).isFile()?requested:resolve(root,"index.html");
        const bytes=await readFile(target);
        const mime:Record<string,string>={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon",".woff2":"font/woff2"};
        res.setHeader("Content-Type",mime[extname(target)]??"application/octet-stream");
        res.setHeader("Content-Security-Policy","default-src 'self'; connect-src 'self' ws://127.0.0.1:*; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'");
        res.end(bytes);return;
      }catch{ /* Fall through to 404. */ }
    }
  }
  res.writeHead(404); res.end(JSON.stringify({ error: "Not found" }));
});
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", ws => ws.send(JSON.stringify({ type: "snapshot", channels: xr18.listChannels(), status: xr18.status(), main: xr18.mainState(), meters:xr18.meterState() })));
xr18.on("state", state => { const message = JSON.stringify({ type: "channel", state }); for (const ws of wss.clients) if (ws.readyState === WebSocket.OPEN) ws.send(message); });
xr18.on("main", state => {const message=JSON.stringify({type:"main",state});for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN)ws.send(message);});
xr18.on("meters",state=>{const message=JSON.stringify({type:"meters",state});for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN)ws.send(message);});
xr18.on("advanced", state => {const message=JSON.stringify({type:"advanced",state});for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN)ws.send(message);});
xr18.on("connection", () => {const message=JSON.stringify({type:"status",status:xr18.status()});for(const ws of wss.clients)if(ws.readyState===WebSocket.OPEN)ws.send(message);});
xr18.on("warning", warning => console.warn("[OSC]", warning));
await xr18.start();
const port = Number(process.env.HTTP_PORT ?? 3000);
server.listen(port, "127.0.0.1", () => console.log(`XR18 Studio API on http://127.0.0.1:${port} (${mode})`));
process.on("SIGINT", () => { xr18.close(); database.close(); server.close(); });
