import test from "node:test";
import assert from "node:assert/strict";
import dgram from "node:dgram";
import {XR18,liveAllowed} from "../src/xr18.js";
import {encodeOsc,decodeOsc,oscFloat} from "../src/osc.js";
import {readbackTolerance,wireSteps} from "../src/parameters.js";
import {liveControlPermitted} from "../src/access.js";

/** Tiny XR18 stand-in that quantizes floats the way the console does. */
async function fakeMixer(){
 const socket=dgram.createSocket("udp4");const store=new Map<string,number>();const received:string[]=[];
 socket.on("message",(data,remote)=>{
  const msg=decodeOsc(data);received.push(msg.address);
  if(msg.address==="/meters"){const blob=Buffer.alloc(84);blob.writeUInt32LE(40,0);for(let i=0;i<40;i++)blob.writeInt16LE(-(i+1)*256,4+i*2);socket.send(encodeOsc("/meters/1",[blob]),remote.port,remote.address);return;}
  if(msg.address.startsWith("/xremote"))return;
  if(msg.args.length){const steps=wireSteps(msg.address);const v=msg.args[0] as number;store.set(msg.address,steps?Math.round(v*(steps-1))/(steps-1):v);return;}
  const v=store.get(msg.address)??(msg.address.endsWith("/name")?"":0);
  socket.send(encodeOsc(msg.address,[typeof v==="number"&&!Number.isInteger(v)?oscFloat(v):typeof v==="number"?oscFloat(v):v]),remote.port,remote.address);
 });
 await new Promise<void>(r=>socket.bind(0,"127.0.0.1",()=>r()));
 return {port:(socket.address() as {port:number}).port,store,received,close:()=>socket.close()};
}
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));

test("quantized readbacks (HPF/pan 101 steps) are accepted, as on the real console",async()=>{
 const mixer=await fakeMixer();
 const xr=new XR18({mode:"real",host:"127.0.0.1",port:mixer.port,enableWrites:true});
 try{
  await xr.start();
  for(let i=0;i<50&&!xr.status().connected;i++)await wait(20);
  assert.ok(xr.status().connected,"meters or replies mark the console live");
  // 0.3349 is stored as 0.33 by a 101-step control: the old fixed 0.003 tolerance threw "Lecture différente".
  const hpf=Number(await xr.writeParameter("/ch/01/preamp/hpf",.3349));
  assert.ok(Math.abs(hpf-.3349)>.003&&Math.abs(hpf-.3349)<readbackTolerance("/ch/01/preamp/hpf"));
  await xr.writeParameter("/ch/01/mix/pan",.5049);
  await xr.writeParameter("/ch/01/eq/2/f",.4321);
  await xr.writeParameter("/ch/01/mix/01/level",.6131);
 }finally{xr.close();mixer.close();}
});

test("all 40 X-Air meters are kept in /meters/1 order",async()=>{
 const mixer=await fakeMixer();
 const xr=new XR18({mode:"real",host:"127.0.0.1",port:mixer.port,enableWrites:false});
 try{
  await xr.start();
  for(let i=0;i<50&&!xr.meterState().available;i++)await wait(20);
  const m=xr.meterState();
  assert.equal(m.all.length,40);assert.equal(m.channels.length,16);
  assert.equal(m.all[36],-37);assert.equal(m.all[37],-38);
 }finally{xr.close();mixer.close();}
});

test("live control sends immediately, then re-reads the stored value",async()=>{
 const mixer=await fakeMixer();
 const xr=new XR18({mode:"real",host:"127.0.0.1",port:mixer.port,enableWrites:true});
 try{
  await xr.start();
  for(let i=0;i<50&&!xr.status().connected;i++)await wait(20);
  xr.liveSet("/ch/03/mix/fader",.7);
  assert.equal(xr.listChannels()[2]!.fader,.7);
  await wait(450);
  assert.ok(mixer.received.filter(a=>a==="/ch/03/mix/fader").length>=2,"value then readback request");
  xr.liveSet("/-stat/solosw/03",1);
  assert.throws(()=>xr.liveSet("/headamp/01/phantom",1),/autorisé/);
  assert.throws(()=>xr.liveSet("/routing/main/01",1),/autorisé/);
 }finally{xr.close();mixer.close();}
});

test("live control rules: no 48 V or routing; musicians only their monitor sends",()=>{
 assert.equal(liveAllowed("/ch/01/mix/fader"),true);
 assert.equal(liveAllowed("/headamp/01/gain"),true);
 assert.equal(liveAllowed("/headamp/01/phantom"),false);
 const musician={id:"m",name:"m",role:"musician" as const,buses:[2]};
 assert.equal(liveControlPermitted(musician,"/ch/05/mix/02/level"),true);
 assert.equal(liveControlPermitted(musician,"/ch/05/mix/03/level"),false);
 assert.equal(liveControlPermitted(musician,"/ch/05/mix/fader"),false);
});

test("simulation live view is seeded with every parameter",async()=>{
 const xr=new XR18({mode:"simulation",host:"127.0.0.1",port:10024,enableWrites:false});
 await xr.syncLiveView();
 assert.ok(Object.keys(xr.parameterState()).length>2000);
 xr.liveSet("/ch/02/mix/on",0);assert.equal(xr.listChannels()[1]!.on,false);
});
