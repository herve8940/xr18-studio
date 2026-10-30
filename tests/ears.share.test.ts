import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import WebSocket from "ws";
import {XR18} from "../src/xr18.js";
import {EarsShare,earAddressKind,earSafeValue,EAR_CAP,EAR_MAX_RAISE,lanAddresses} from "../src/ears.js";

test("a monitor link only reaches its own bus",()=>{
 assert.equal(earAddressKind(2,"/ch/05/mix/02/level"),"level");
 assert.equal(earAddressKind(2,"/rtn/aux/mix/02/level"),"level");
 assert.equal(earAddressKind(2,"/bus/2/mix/fader"),"level");
 assert.equal(earAddressKind(2,"/bus/2/mix/on"),"mute");
 for(const a of ["/ch/05/mix/03/level","/ch/05/mix/fader","/lr/mix/fader","/bus/3/mix/fader","/headamp/01/phantom","/ch/05/mix/02/tap"])assert.equal(earAddressKind(2,a),null,a);
});
test("phone levels are capped at 0 dB and raised progressively, lowering is free",()=>{
 assert.equal(earSafeValue("level",1,EAR_CAP),EAR_CAP);
 assert.equal(earSafeValue("level",.7,.2),.2+EAR_MAX_RAISE);
 assert.equal(earSafeValue("level",0,.7),0);
 assert.throws(()=>earSafeValue("mute",.5,1));
 assert.throws(()=>earSafeValue("level","x",0));
});
test("virtual adapters are listed after real network cards",()=>{
 const list=lanAddresses({docker0:[{address:"172.17.0.1",family:"IPv4",internal:false} as never],en0:[{address:"192.168.1.20",family:"IPv4",internal:false} as never],lo:[{address:"127.0.0.1",family:"IPv4",internal:true} as never]});
 assert.deepEqual(list,["192.168.1.20","172.17.0.1"]);
});

const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
test("QR link: snapshot, capped control, refusal outside the bus, revocation",async()=>{
 const dir=mkdtempSync(join(tmpdir(),"ears-"));
 const xr=new XR18({mode:"simulation",host:"127.0.0.1",port:10024,enableWrites:false});
 await xr.syncLiveView();
 let busy=false;
 const ears=new EarsShare(join(dir,"db.sqlite"),xr,()=>undefined,()=>busy?"occupé":null,()=>{});
 try{
  const share=ears.create("Hervé",3);
  const status=await ears.start(0);
  assert.ok(status.running&&status.port>0);
  const bad=new WebSocket(`ws://127.0.0.1:${status.port}/ears-ws?token=nope`);
  await new Promise<void>(r=>{bad.on("error",()=>r());bad.on("unexpected-response",()=>r());});
  const ws=new WebSocket(`ws://127.0.0.1:${status.port}/ears-ws?token=${share.token}`);
  const messages:Record<string,unknown>[]=[];ws.on("message",d=>messages.push(JSON.parse(String(d))));
  await new Promise(r=>ws.once("open",r));await wait(100);
  const snap=messages.find(m=>m.type==="snapshot") as {share:{bus:number};values:Record<string,unknown>};
  assert.equal(snap.share.bus,3);
  assert.ok(Object.keys(snap.values).every(a=>/\/(mix\/03\/level|config\/(name|color)|mix\/on)$/.test(a)||a.startsWith("/bus/3/")),"only bus 3 data is shared");
  xr.liveSet("/ch/01/mix/03/level",.7);
  ws.send(JSON.stringify({type:"set",address:"/ch/01/mix/03/level",value:1}));await wait(80);
  assert.equal(xr.parameterState()["/ch/01/mix/03/level"]!.value,EAR_CAP);
  ws.send(JSON.stringify({type:"set",address:"/ch/01/mix/fader",value:1}));await wait(80);
  assert.ok(messages.some(m=>m.type==="error"),"front-of-house fader is refused");
  busy=true;ws.send(JSON.stringify({type:"set",address:"/bus/3/mix/on",value:0}));await wait(80);busy=false;
  assert.ok(messages.filter(m=>m.type==="error").length>=2,"blocked while an operation runs");
  const closed=new Promise(r=>ws.once("close",r));ears.regenerate(share.id);await closed;
  const page=await fetch(`http://127.0.0.1:${status.port}/ears/${share.token}`);
  assert.equal(page.status,404,"old QR code no longer works");
  const qr=await ears.qr(share.id).catch(()=>null);
  if(qr)assert.match(qr.svg,/<svg/);
 }finally{await ears.stop();ears.close();xr.close();}
});
